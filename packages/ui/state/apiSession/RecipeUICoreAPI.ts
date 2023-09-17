import { RecipeProject, Recipe } from "types/database";
import { getRecipeUICoreStore } from ".";
import { useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";
import { isUUID } from "utils";

let recipeUICoreAPIloaded = false;

type UICoreProjectInfo = {
  project: RecipeProject;
  recipes: Recipe[];
} | null;

type UICoreRecipeInfo = {
  recipe: Recipe;
  project: RecipeProject | null;
} | null;

export class RecipeUICoreAPI {
  static getStore = async () => {
    await this.syncCore();

    const store = await getRecipeUICoreStore();
    const core = await store.get("core");

    return {
      collections: core?.collections ?? [],
      recipes: core?.recipes ?? [],
    };
  };

  static syncCore = async () => {
    if (recipeUICoreAPIloaded) {
      return;
    }

    let collections: RecipeProject[] = [];
    let recipes: Recipe[] = [];
    try {
      collections = (await import("collections/build/core/collections.json"))
        .default as RecipeProject[];

      recipes = (await import("collections/build/core/apis.json"))
        .default as unknown as Recipe[];
    } catch (error) {
      console.error(error);
    }

    const store = await getRecipeUICoreStore();

    await store.put(
      {
        collections,
        recipes,
      },
      "core"
    );

    recipeUICoreAPIloaded = true;
  };

  static getProjectInfoWithProjectNameOrId = async ({
    projectNameOrId,
  }: {
    projectNameOrId: string;
  }): Promise<UICoreProjectInfo> => {
    const core = await this.getStore();

    const project = core?.collections.find((p: RecipeProject) =>
      isUUID(projectNameOrId)
        ? p.id === projectNameOrId
        : p.project === projectNameOrId
    );

    const recipes = project?.project
      ? core?.recipes.filter((r: Recipe) => r.project === project.project)
      : [];

    return project
      ? {
          project,
          recipes,
        }
      : null;
  };

  static getRecipeWithRecipeId = async ({
    recipeId,
  }: {
    recipeId: string;
  }): Promise<UICoreRecipeInfo> => {
    const core = await this.getStore();

    const recipe = core?.recipes.find((r: Recipe) => r.id === recipeId);
    const project = recipe
      ? core?.collections.find(
          (p: RecipeProject) => p.project === recipe.project
        )
      : null;

    return recipe
      ? {
          recipe: recipe || null,
          project: project || null,
        }
      : null;
  };
}

export function useCoreProject({ projectName }: { projectName: string }) {
  const [loading, setLoading] = useState(true);
  const [projectInfo, setProject] = useState<UICoreProjectInfo>(null);

  useEffect(() => {
    setLoading(true);

    RecipeUICoreAPI.getProjectInfoWithProjectNameOrId({
      projectNameOrId: projectName,
    })
      .then((result) => {
        setProject(result);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectName]);

  return {
    loading,
    projectInfo,
  };
}

export function useCoreRecipe({ recipeId }: { recipeId: string }) {
  const [loading, setLoading] = useState(true);
  const [recipeInfo, setRecipe] = useState<UICoreRecipeInfo>(null);

  useEffect(() => {
    setLoading(true);

    RecipeUICoreAPI.getRecipeWithRecipeId({ recipeId })
      .then((result) => {
        setRecipe(result);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [recipeId]);

  return {
    loading,
    recipeInfo,
  };
}

export function useLocalProjects() {
  const [localProjects, setLocalProjects] = useState<RecipeProject[]>([]);
  useEffect(() => {
    RecipeUICoreAPI.getStore().then((store) => {
      setLocalProjects(store.collections);
    });
  }, []);

  return localProjects;
}
