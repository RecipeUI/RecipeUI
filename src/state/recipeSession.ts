import { create } from "zustand";
import _recipes from "../assets/recipes.json";
import { Recipe } from "../types/recipes";
import { produce } from "immer";
import { getArrayPathIndex, isArrayPath } from "../utils/main";

const recipes = [...(_recipes as Recipe[])];

export enum RecipeBodyRoute {
  Parameters = "Parameters",
  Examples = "Examples",
  Config = "Config",
}

export interface RecipeBodyState {
  bodyRoute: RecipeBodyRoute;
  setBodyRoute: (route: RecipeBodyRoute) => void;

  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe) => void;
  recipes: Recipe[];

  requestBody: Record<string, unknown>;
  setRequestBody: (requestBody: Record<string, unknown>) => void;
  updateRequestBody: (updateProps: { path: string; value: unknown }) => void;
}

export const useRecipeSessionStore = create<RecipeBodyState>((set) => {
  return {
    bodyRoute: RecipeBodyRoute.Parameters,
    setBodyRoute: (route) => set(() => ({ bodyRoute: route })),

    recipes,
    // selectedRecipe: null,
    selectedRecipe: recipes[0], // TODO: Testing
    setSelectedRecipe: (recipe) => set(() => ({ selectedRecipe: recipe })),

    requestBody: {},
    setRequestBody: (requestBody) => set(() => ({ requestBody })),
    updateRequestBody: ({ path, value }) =>
      set((prevState) => {
        const nextState = produce(prevState.requestBody, (draft) => {
          const paths = path.split(".").slice(1);

          while (paths.length > 1) {
            const current = paths.shift()!;
            draft = (
              isArrayPath(current)
                ? draft[getArrayPathIndex(current)]
                : draft[current]
            ) as typeof draft;
          }

          const finalPath = paths[0];
          if (value === undefined) {
            delete draft[finalPath];
            return;
          } else {
            if (isArrayPath(finalPath)) {
              draft[getArrayPathIndex(finalPath)] = value;
            } else {
              draft[finalPath] = value;
            }
          }
        });

        return { requestBody: nextState };
      }),
  };
});
