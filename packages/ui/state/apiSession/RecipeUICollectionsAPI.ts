import { RecipeProject, Recipe } from "types/database";
import { getRecipeUICollectionStore } from ".";
import { useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";
import { isUUID } from "utils";
import { CollectionType } from "utils/constants";

let recipeUICoreAPIloaded = false;
let recipeUICommunityAPIloaded = false;

type UIProjectInfo = {
  project: RecipeProject;
  recipes: Recipe[];
} | null;

type UIRecipeInfo = {
  recipe: Recipe;
  project: RecipeProject | null;
} | null;

export class RecipeUICollectionsAPI {
  static getStore = async () => {
    await this.syncCollections(CollectionType.Core);
    await this.syncCollections(CollectionType.Community);

    const store = await getRecipeUICollectionStore();
    const core = await store.get(CollectionType.Core);
    const community = await store.get(CollectionType.Community);

    const collections = [
      ...(core?.collections ?? []),
      ...(community?.collections ?? []),
    ];
    const apis = [...(core?.recipes ?? []), ...(community?.recipes ?? [])];

    return {
      collections,
      recipes: apis,
    };
  };

  static syncAllCollections = async () => {
    await this.syncCollections(CollectionType.Core);
    await this.syncCollections(CollectionType.Community);
  };

  static syncCollections = async (type: CollectionType) => {
    if (type === CollectionType.Core && recipeUICoreAPIloaded) {
      return;
    } else if (
      type === CollectionType.Community &&
      recipeUICommunityAPIloaded
    ) {
      return;
    }

    let collections: RecipeProject[] = [];
    let recipes: Recipe[] = [];
    try {
      collections = (await import(`collections/build/${type}/collections.json`))
        .default as RecipeProject[];

      recipes = (await import(`collections/build/${type}/apis.json`))
        .default as unknown as Recipe[];
    } catch (error) {
      console.error(error);
    }

    const store = await getRecipeUICollectionStore();

    await store.put(
      {
        collections,
        recipes,
      },
      type
    );
  };

  static getProjectInfoWithProjectNameOrId = async ({
    projectNameOrId,
  }: {
    projectNameOrId: string;
  }): Promise<UIProjectInfo> => {
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
  }): Promise<UIRecipeInfo> => {
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
  const [projectInfo, setProject] = useState<UIProjectInfo>(null);

  useEffect(() => {
    setLoading(true);

    RecipeUICollectionsAPI.getProjectInfoWithProjectNameOrId({
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
  const [recipeInfo, setRecipe] = useState<UIRecipeInfo>(null);

  useEffect(() => {
    setLoading(true);

    RecipeUICollectionsAPI.getRecipeWithRecipeId({ recipeId })
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
    RecipeUICollectionsAPI.getStore().then((store) => {
      setLocalProjects(store.collections);
    });
  }, []);

  return localProjects;
}
