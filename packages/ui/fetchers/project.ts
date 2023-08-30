import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database, Recipe, RecipeProject } from "types/database";

interface ProjectFetcher {
  project: string;
  supabase: SupabaseClient<Database>;
}

export async function fetchProjectPage({
  project,
  supabase,
}: ProjectFetcher): Promise<{
  project: RecipeProject | null;
  recipes: Recipe[] | null;
  projectName: string;
}> {
  const projectName = decodeURIComponent(project);

  const { data: projectInfo } = await supabase
    .from("project")
    .select()
    .ilike("project", `%${projectName}%`)
    .limit(1)
    .single();

  const { data: projectRecipes } = await supabase
    .from("recipe_view")
    .select()
    .ilike("project", `%${projectName}%`);

  return {
    project: projectInfo,
    recipes: projectRecipes as Recipe[] | null,
    projectName,
  };
}

export async function fetchProject({
  project,
  supabase,
}: {
  project: string;
  supabase: SupabaseClient<Database>;
}) {
  const { data: projectInfo } = await supabase
    .from("project")
    .select()
    .ilike("project", `%${project}%`)
    .limit(1)
    .single();

  return projectInfo;
}
