import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  Database,
  Recipe,
  RecipeProject,
  UserTemplatePreview,
} from "types/database";
import { getProjectSplit } from "../utils/main";

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
