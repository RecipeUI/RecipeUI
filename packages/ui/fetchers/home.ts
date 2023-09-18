import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  Database,
  Recipe,
  RecipeProject,
  UserTemplatePreview,
} from "types/database";
import { getProjectSplit } from "../utils/main";

interface HomeFetcher {
  searchParams: {
    sessionId?: string;
    recipeId?: string;
  };
  supabase: SupabaseClient<Database>;
}

export async function fetchHomeProjects({
  supabase,
}: {
  supabase: HomeFetcher["supabase"];
}) {
  return await supabase.from("project").select();
}

export async function fetchHome({
  searchParams,
  supabase,
}: HomeFetcher): Promise<{
  userProjects: RecipeProject[];
  recipe: Recipe | null;
}> {
  const { recipeId } = searchParams;
  const projectRes = await fetchHomeProjects({
    supabase,
  });
  const { userProjects } = getProjectSplit(
    (projectRes.data || []) as RecipeProject[]
  );

  return {
    userProjects,
    recipe: recipeId
      ? await fetchHomeRecipe({ recipeId: recipeId, supabase })
      : null,
  };
}

export async function fetchHomeRecipe({
  recipeId,
  supabase,
}: {
  recipeId: string;
  supabase: HomeFetcher["supabase"];
}) {
  let response = recipeId
    ? await supabase.from("recipe").select().eq("id", recipeId).single()
    : null;

  if ((response && response.error) || !response?.data) {
    // This might be a recipe from an unlisted project
    response = await supabase
      .rpc("get_recipe_from_unlisted_project", { recipe_id: recipeId })
      .single();

    if ((response && response.error) || !response?.data) {
      return null;
    }
  }

  const recipe = response.data as Recipe;
  const { data: userData } = await supabase.auth.getUser();

  if (userData.user) {
    const {
      data: templateRes,
      error,
      statusText,
    } = await supabase
      .from("template_view")
      .select(
        "id, created_at, title, description, original_author, recipe, visibility, alias, author_id, project_scope"
      )
      .or(`author_id.eq.${userData.user.id},project_scope.eq.team`)
      .eq("recipe_id", recipeId);

    if (error) {
      console.error(error);
    }
    if (!error && templateRes && templateRes.length > 0) {
      recipe.userTemplates = (templateRes as UserTemplatePreview[]).reverse();
    }
  }

  return recipe;
}
