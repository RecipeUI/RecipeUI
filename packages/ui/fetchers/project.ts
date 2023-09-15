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

  if (projectInfo) {
    const { data: projectRecipes } = await supabase
      .from("recipe_view")
      .select()
      .ilike("project", `%${projectName}%`);

    return {
      project: projectInfo,
      recipes: projectRecipes as Recipe[] | null,
      projectName,
    };
  } else {
    // This could be unlisted

    const unlistedProjectInfo = await supabase.rpc("get_unlisted_project", {
      project_id: projectName,
    });

    if (!unlistedProjectInfo.data) {
      return {
        project: null,
        recipes: null,
        projectName,
      };
    }

    const recipeInfo = await supabase.rpc("get_recipes_from_unlisted_project", {
      project_id: projectName,
    });

    return {
      project: (unlistedProjectInfo.data[0] as RecipeProject) || null,
      recipes: (recipeInfo.data as Recipe[]) || null,
      projectName,
    };
  }
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

  if (!projectInfo) {
    const unlistedProjectInfo = await supabase
      .rpc("get_unlisted_project", {
        project_id: project,
      })
      .single();

    if (!unlistedProjectInfo.data) {
      return null;
    }

    return (unlistedProjectInfo.data as RecipeProject) || null;
  }

  return projectInfo;
}
