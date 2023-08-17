import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Database,
  Recipe,
  RecipeProject,
  UserTemplatePreview,
} from "types/database";
import { redirect } from "next/navigation";
import { getProjectSplit } from "ui/utils/main";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: {
    sessionId?: string;
    recipeId?: string;
  };
}) {
  const { sessionId, recipeId } = searchParams;

  if (recipeId == null && sessionId) {
    redirect("/");
  }

  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const projectRes = await supabase.from("project").select();
  const { globalProjects, userProjects } = getProjectSplit(
    (projectRes.data || []) as RecipeProject[]
  );

  let recipe: null | Recipe = null;

  if (recipeId) {
    const response = recipeId
      ? await supabase.from("recipe").select().eq("id", recipeId).single()
      : null;

    if ((response && response.error) || !response?.data) {
      redirect("/");
      return;
    }

    recipe = response.data as Recipe;
    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      let builder = supabase
        .from("template_view")
        .select(
          "id, created_at, title, description, original_author, recipe, visibility, alias, author_id, scope"
        )
        // .or(`author_id.eq.${userData.user.id},scope.eq.team`)
        .eq("recipe_id", recipeId);

      const { data: templateRes, error, statusText } = await builder;
      // If global just get author_id, else fetch all we can see

      if (!error && templateRes && templateRes.length > 0) {
        recipe.userTemplates = (templateRes as UserTemplatePreview[]).reverse();
      }
    }
  }

  return (
    <RecipeHomeContainer
      globalProjects={globalProjects}
      projects={userProjects}
      recipe={recipe || undefined}
      sessionId={sessionId}
    />
  );
}
