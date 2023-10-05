"use client";

import { useCallback, useContext, useRef } from "react";
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
} from "../state/apiSession";
import { FolderAPI } from "../state/apiSession/FolderAPI";
import { SupabaseContext } from "../components/Providers/SupabaseProvider";
import { fetchHomeRecipe } from "../fetchers/home";
import { getConfigFromRecipe } from "../components/RecipeBody/RecipeLeftPane/RecipeForkTab";
import { RecipeUICollectionsAPI } from "../state/apiSession/RecipeUICollectionsAPI";
import { Recipe } from "types/database";

export function useInitializeRecipe() {
  const supabase = useContext(SupabaseContext);
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const initializeRecipe = useCallback(
    async (
      recipeId: string,
      options?: {
        recipeTitle?: string;
        recipePreDefined?: Recipe;
        noCurrentSession?: boolean;
        projectId?: string;
        sessionId?: string;
      }
    ) => {
      const { recipeTitle, recipePreDefined } = options || {};

      try {
        // get the recipe information first

        let recipe: Recipe | null = recipePreDefined || null;

        if (!recipe) {
          let coreInfo = await RecipeUICollectionsAPI.getRecipeWithRecipeId({
            recipeId,
          });

          if (coreInfo) {
            recipe = coreInfo.recipe;
          } else {
            recipe = await fetchHomeRecipe({
              recipeId: recipeId,
              supabase,
            });
          }
        }
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
          id: options?.sessionId ?? uuidv4(),
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
          options?.projectId ?? recipe.project,
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
