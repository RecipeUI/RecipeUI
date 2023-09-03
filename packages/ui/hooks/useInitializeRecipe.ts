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
  initializeRecipeList,
  setConfigForSessionStore,
  useSessionFolders,
} from "../state/apiSession";
import { SupabaseContext } from "../components/Providers/SupabaseProvider";
import { fetchHomeRecipe } from "../fetchers/home";
import { getConfigFromRecipe } from "../components/RecipeBody/RecipeLeftPane/RecipeForkTab";

export function useInitializeRecipe() {
  const supabase = useContext(SupabaseContext);
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const { addSessionToFolder } = useSessionFolders();
  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const initializeRecipe = useCallback(
    async (recipeId: string) => {
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

        const firstTemplate = recipe.templates ? recipe.templates[0] : null;

        initializeEditorSession({
          ...sessionConfig,
          currentSession: newSession,
          outputTab: RecipeOutputTab.DocTwo,
          ...(firstTemplate && {
            editorBody: firstTemplate.requestBody
              ? JSON.stringify(firstTemplate.requestBody, null, 2)
              : "",
            editorQuery: firstTemplate.queryParams
              ? JSON.stringify(firstTemplate.queryParams, null, 2)
              : "",
            editorURLCode: firstTemplate.urlParams
              ? JSON.stringify(firstTemplate.urlParams, null, 2)
              : "",
          }),
        });

        await addSessionToFolder(newSession.id, recipe.project, recipe.project);
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
    [
      addSessionToFolder,
      initializeEditorSession,
      isTauri,
      setDesktopPage,
      supabase,
    ]
  );

  return {
    initializeRecipe,
  };
}
