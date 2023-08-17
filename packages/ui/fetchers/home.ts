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

export async function fetchHome({
  searchParams,
  supabase,
}: HomeFetcher): Promise<{
  globalProjects: RecipeProject[];
  userProjects: RecipeProject[];
  recipe: Recipe | null;
}> {
  const { recipeId } = searchParams;
  const projectRes = await supabase.from("project").select();
  const { globalProjects, userProjects } = getProjectSplit(
    (projectRes.data || []) as RecipeProject[]
  );

  const returnObj = {
    globalProjects,
    userProjects,
    recipe: null as Recipe | null,
  };

  if (recipeId) {
    const response = recipeId
      ? await supabase.from("recipe").select().eq("id", recipeId).single()
      : null;
    if ((response && response.error) || !response?.data) {
      return returnObj;
    }

    returnObj.recipe = response.data as Recipe;
    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      const {
        data: templateRes,
        error,
        statusText,
      } = await supabase
        .from("template_view")
        .select(
          "id, created_at, title, description, original_author, recipe, visibility, alias, author_id, scope"
        )
        .or(`author_id.eq.${userData.user.id},scope.eq.team`)
        .eq("recipe_id", recipeId);

      if (!error && templateRes && templateRes.length > 0) {
        returnObj.recipe.userTemplates = (
          templateRes as UserTemplatePreview[]
        ).reverse();
      }
    }
  }
  return returnObj;
}
