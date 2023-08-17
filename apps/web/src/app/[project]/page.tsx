import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database, Recipe, RecipeProject } from "types/database";
import { ProjectContainer } from "ui/components/Project/ProjectContainer";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: {
    project: string;
  };
}) {
  const projectName = decodeURIComponent(params.project);
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const { data: projectInfo } = await supabase
    .from("project")
    .select()
    .ilike("project", `%${projectName}%`)
    .limit(1)
    .single();

  const { data: projectRecipes } = await supabase
    .from("recipe")
    .select()
    .ilike("project", `%${projectName}%`);

  return (
    <ProjectContainer
      projectName={projectName}
      project={projectInfo as RecipeProject | null}
      recipes={projectRecipes as Recipe[] | null}
    />
  );
}
