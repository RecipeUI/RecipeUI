"use client";

import { useCallback, useContext } from "react";
import {
  DesktopPage,
  RecipeOutputTab,
  RecipeSession,
  useRecipeSessionStore,
} from "../state/recipeSession";
import { v4 as uuidv4 } from "uuid";
import { useIsTauri } from "./useIsTauri";
import {
  FolderAPI,
  initializeRecipeList,
  setConfigForSessionStore,
} from "../state/apiSession";
import { SupabaseContext } from "../components/Providers/SupabaseProvider";
import { fetchHomeRecipe } from "../fetchers/home";
import { getConfigFromRecipe } from "../components/RecipeBody/RecipeLeftPane/RecipeForkTab";

export function useInitializeRecipe() {
  const supabase = useContext(SupabaseContext);
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const initializeRecipe = useCallback(
    async (recipeId: string, recipeTitle?: string) => {
      try {
        // get the recipe information first
        const recipe = await fetchHomeRecipe({
          recipeId: recipeId,
          supabase,
        });

        if (!recipe) {
          throw new Error("Recipe not found");
        }

        const { config: sessionConfig } = getConfigFromRecipe(recipe);

        await setConfigForSessionStore({
          config: sessionConfig,
          recipeId: recipe.id,
        });

        if (recipe.templates) {
          await initializeRecipeList(recipe, recipe.templates);
        }

        const newSession: RecipeSession = {
          id: uuidv4(),
          name: recipe.title,
          apiMethod: sessionConfig.editorMethod,
          recipeId: recipe.id,
        };

        let firstTemplate = recipe.templates ? recipe.templates[0] : null;

        if (recipeTitle && recipe.templates) {
          firstTemplate =
            recipe.templates.find((t) => t.title === recipeTitle) ||
            firstTemplate;
        }

        initializeEditorSession({
          ...sessionConfig,
          currentSession: newSession,
          outputTab: RecipeOutputTab.DocTwo,
          ...(firstTemplate && {
            editorBody:
              firstTemplate.requestBody &&
              Object.keys(firstTemplate.requestBody).length > 0
                ? JSON.stringify(firstTemplate.requestBody, null, 2)
                : "",
            editorQuery:
              firstTemplate.queryParams &&
              Object.keys(firstTemplate.queryParams).length > 0
                ? JSON.stringify(firstTemplate.queryParams, null, 2)
                : "",
            editorURLCode:
              firstTemplate.urlParams &&
              Object.keys(firstTemplate.urlParams).length > 0
                ? JSON.stringify(firstTemplate.urlParams, null, 2)
                : "",
          }),
        });

        await FolderAPI.addSessionToFolder(
          newSession.id,
          recipe.project,
          recipe.project
        );
      } catch (e) {
        if (isTauri) {
          setDesktopPage({
            page: DesktopPage.RecipeView,
            pageParam: recipeId,
          });
        }
      } finally {
      }
    },
    [initializeEditorSession, isTauri, setDesktopPage, supabase]
  );

  return {
    initializeRecipe,
  };
}
