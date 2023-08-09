import { Providers } from "@/app/providers";
import { Navbar } from "@/components/Navbar/Navbar";
import { RecipeBody } from "@/components/RecipeBody";
import { RecipeHomeContainer } from "@/components/RecipeHome/RecipeHomeContainer";
import { RecipeSidebar } from "@/components/RecipeSidebar";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import {
  Recipe,
  RecipeProject,
  UserTemplatePreview,
} from "@/types/databaseExtended";
import { RecipeProjectsContext } from "@/state/pageContexts";
import { redirect } from "next/navigation";

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

  const projectsResponse = await supabase.from("project").select();

  const projects = (projectsResponse.data || []) as RecipeProject[];

  //
  let recipe: null | Recipe = null;

  if (recipeId) {
    const response = recipeId
      ? await supabase.from("recipe").select().eq("id", recipeId).single()
      : null;

    if ((response && response.error) || !response?.data) {
      redirect("/");
      return;
    }

    recipe = response.data as unknown as Recipe;
    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      const {
        data: templateRes,
        error,
        statusText,
      } = await supabase
        .from("template_public_view")
        .select(
          "id, created_at, title, description, original_author, recipe, visibility"
        )
        .eq("author_id", userData.user.id)
        .eq("recipe_id", recipeId);

      if (!error && templateRes && templateRes.length > 0) {
        recipe.userTemplates = templateRes.reverse() as UserTemplatePreview[];
      }
    }
  }

  return (
    <RecipeHomeContainer
      recipeProjects={projects}
      recipe={recipe || undefined}
      sessionId={sessionId}
    />
  );
}
