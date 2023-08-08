import { Providers } from "@/app/providers";
import { Navbar } from "@/components/Navbar/Navbar";
import { RecipeBody } from "@/components/RecipeBody";
import { RecipeHomeContainer } from "@/components/RecipeHome/RecipeHomeContainer";
import { RecipeSidebar } from "@/components/RecipeSidebar";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Recipe, RecipeProject } from "@/types/databaseExtended";
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

  // TODO: Future todo list
  const recipe = recipeId
    ? await supabase.from("recipe").select().eq("id", recipeId).single()
    : null;

  if (recipe && recipe.error) {
    redirect("/");
  }

  console.log("refetched", recipe);

  return (
    <RecipeHomeContainer
      recipeProjects={projects}
      recipe={recipe?.data as unknown as Recipe}
      sessionId={sessionId}
    />
  );
}
