import { Providers } from "@/app/providers";
import { Navbar } from "@/components/Navbar";
import { RecipeBody } from "@/components/RecipeBody";
import { RecipeHomeContainer } from "@/components/RecipeHome/RecipeHomeContainer";
import { RecipeSidebar } from "@/components/RecipeSidebar";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { Recipe, RecipeProject } from "@/types/databaseExtended";
import { RecipeProjectsContext } from "@/state/pageContexts";
import { ProjectContainer } from "@/app/[project]/ProjectContainer";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: {
    project: string;
  };
}) {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });
  const { data: projectInfo } = await supabase
    .from("project")
    .select()
    .ilike("project", `%${params.project}%`)
    .single();

  const { data: projectRecipes } = await supabase
    .from("recipe")
    .select()
    .ilike("project", `%${params.project}%`);

  return (
    <ProjectContainer
      projectName={params.project}
      project={projectInfo as RecipeProject | null}
      recipes={projectRecipes as Recipe[] | null}
    />
  );
}
