import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database, Recipe, RecipeProject } from "types/database";
import { isUUID } from "utils";

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

  if (isUUID(projectName)) {
    return await fetchProjectById({ projectId: projectName, supabase });
  }

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
    return {
      project: projectInfo,
      recipes: null,
      projectName,
    };
  }
}

export async function fetchProjectById({
  projectId,
  supabase,
  projectOnly = false,
}: {
  projectId: string;
  supabase: SupabaseClient<Database>;
  projectOnly?: boolean;
}) {
  const unlistedProjectInfo = await supabase.rpc("get_unlisted_project", {
    project_id: projectId,
  });

  if (!unlistedProjectInfo.data || unlistedProjectInfo.data.length === 0) {
    return {
      project: null,
      recipes: null,
      projectName: projectId,
    };
  }

  const recipeInfo = projectOnly
    ? null
    : await supabase.rpc("get_recipes_from_unlisted_project", {
        project_id: projectId,
      });

  return {
    project: (unlistedProjectInfo.data[0] as RecipeProject) || null,
    recipes: recipeInfo ? (recipeInfo.data as Recipe[]) || null : null,
    projectName: unlistedProjectInfo.data[0].project,
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
