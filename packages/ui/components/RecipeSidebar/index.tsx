"use client";

import { useRecipeSessionStore } from "../../state/recipeSession";
import { useEffect, useState } from "react";
import { useSessionStorage } from "usehooks-ts";
import {
  eventEmitter,
  getSessionsFromStore,
  saveSessionToStore,
} from "../../state/apiSession";

import { COLLECTION_FORKING_ID, RECIPE_FORKING_ID } from "utils/constants";

import { useInitializeRecipe } from "../../hooks/useInitializeRecipe";
import { Recipe } from "types/database";
import { useSupabaseClient } from "../Providers/SupabaseProvider";
import { fetchProjectPage } from "../../fetchers/project";
import { RecipeUICollectionsAPI } from "../../state/apiSession/RecipeUICollectionsAPI";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarSessions } from "./SidebarSessions";
import { v4 as uuidv4 } from "uuid";
import { produce } from "immer";
export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const setSessions = useRecipeSessionStore((state) => state.setSessions);

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;

    saveSessionToStore(sessions);
  }, [loaded, sessions, setSessions]);

  const [recipeFork, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");
  const [collectionFork, setCollectionFork] = useSessionStorage(
    COLLECTION_FORKING_ID,
    ""
  );

  const { initializeRecipe } = useInitializeRecipe();
  const supabase = useSupabaseClient();

  useEffect(() => {
    // The only place we initialize forks from APIs
    async function initializeAPIs() {
      if (!recipeFork) return;

      let [forkId, recipeTitle] = recipeFork.split("::");

      setRecipeFork("");
      initializeRecipe(forkId, { recipeTitle });
    }

    async function initializeCollection() {
      let recipes: Recipe[] = [];
      const localProject =
        await RecipeUICollectionsAPI.getProjectInfoWithProjectNameOrId({
          projectNameOrId: collectionFork,
        });

      if (localProject) {
        recipes = localProject.recipes;
      } else {
        const { recipes: _recipes } = await fetchProjectPage({
          project: collectionFork,
          supabase,
        });

        if (_recipes) {
          recipes = _recipes;
        }
      }

      setCollectionFork("");

      const uniqueProjectId = uuidv4();

      if (recipes && recipes.length > 0) {
        const modifiedRecipes = produce(recipes, (draft) => {
          draft.forEach((recipe) => {
            recipe.id = uuidv4();
          });
        });

        for (let i = 0; i < modifiedRecipes.length; i++) {
          const recipe = modifiedRecipes[i];
          await initializeRecipe(recipe.id, {
            recipePreDefined: recipe,
            noCurrentSession: i !== recipes.length - 1,
            projectId: uniqueProjectId,
            sessionId: recipe.id,
          });
        }
      }
    }

    async function refreshSidebar() {
      const sessions = await getSessionsFromStore();
      setSessions(sessions || []);
    }

    eventEmitter.on("refreshSidebar", refreshSidebar);
    refreshSidebar().then(() => {
      if (!loaded) {
        if (collectionFork) {
          initializeCollection();
        } else {
          initializeAPIs();
        }
        setLoaded(true);
      }
    });
    return () => {
      eventEmitter.off("refreshSidebar", refreshSidebar);
    };
  }, []);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:block w-60 border-r border-r-slate-200 dark:border-r-slate-600 overflow-x-clip overflow-y-auto">
      <SidebarHeader />
      <SidebarSessions />
    </div>
  );
}
