import { Providers } from "@/app/providers";
import { Navbar } from "@/components/Navbar";
import { RecipeBody } from "@/components/RecipeBody";
import { RecipeHomeContainer } from "@/components/RecipeHome/RecipeHomeContainer";
import { RecipeSidebar } from "@/components/RecipeSidebar";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { RecipeProject } from "@/types/databaseExtended";
import { RecipeProjectsContext } from "@/state/pageContexts";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: {
    project: string;
  };
}) {
  const projectsResponse = await createServerComponentClient<Database>({
    cookies,
  })
    .from("project")
    .select()
    .eq("project", params.project)
    .single();

  console.log("here", projectsResponse);
  return null;
  //   const projects = (projectsResponse.data || []) as RecipeProject[];
  //   return <RecipeHomeContainer recipeProjects={projects} />;
}
