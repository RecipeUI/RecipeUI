"use client";

import { useRecipeSessionStore } from "../../state/recipeSession";
import { createContext, useEffect, useState } from "react";
import { useSessionStorage } from "usehooks-ts";
import {
  CloudArrowUpIcon,
  FolderArrowDownIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import {
  eventEmitter,
  getSessionsFromStore,
  saveSessionToStore,
} from "../../state/apiSession";
import { useSessionFolders } from "../../state/apiSession/FolderAPI";

import { COLLECTION_FORKING_ID, RECIPE_FORKING_ID } from "utils/constants";

import { CurlModal } from "../../pages/editor/Builders/CurlModal";
import { useInitializeRecipe } from "../../hooks/useInitializeRecipe";
import { Recipe, RecipeSession } from "types/database";
import { useSupabaseClient } from "../Providers/SupabaseProvider";
import { fetchProjectPage } from "../../fetchers/project";
import { RecipeUICollectionsAPI } from "../../state/apiSession/RecipeUICollectionsAPI";
import {
  RecipeCloudContext,
  useRecipeCloud,
} from "../../state/apiSession/CloudAPI";
import { ViewCollectionModal } from "./Modal/ViewCollectionModal";
import { FolderModal } from "./Modal/FolderModal";
import { SessionTab } from "./SessionTab";
import { SessionFolder } from "./SessionFolder";

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

  const [curlModal, setCurlModal] = useState(false);

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

      if (recipes && recipes.length > 0) {
        for (let i = 0; i < recipes.length; i++) {
          const recipe = recipes[i];
          await initializeRecipe(recipe.id, {
            recipePreDefined: recipe,
            noCurrentSession: i !== recipes.length - 1,
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

  const [viewCollectionModal, setViewCollectionModal] = useState(false);

  const { rootFolderSessionsExtended, noFolderSessions } = useSessionFolders();
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  const [addFolderModal, setAddFolderModal] = useState(false);
  const recipeCloud = useRecipeCloud();

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:block w-60 border-r border-r-slate-200 dark:border-r-slate-600 overflow-x-clip overflow-y-auto">
      <div className="dropdown cursor-pointer w-full right-0 text-start border-b border-recipe-slate mb-2">
        <label
          tabIndex={0}
          className="cursor-pointer flex justify-start items-center  h-full px-2 text-xs text-start ml-2 py-4 font-bold"
        >
          New
          <PlusCircleIcon className="w-3 h-3 ml-1" />
        </label>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content  shadow z-10  rounded-lg bg-white dark:bg-slate-600 w-fit border left-2 top-8 text-end text-sm dark:text-white text-black"
          onClick={(e) => {
            // @ts-expect-error Need to get blur
            e.target.parentNode?.parentNode?.blur();

            setTimeout(() => {
              document.getElementById("url-input")?.focus();
            }, 500);
          }}
        >
          <li>
            <button
              onClick={(e) => {
                addEditorSession();
              }}
            >
              Request
            </button>
          </li>
          <li className="">
            <button
              className=""
              onClick={() => {
                setAddFolderModal(true);
              }}
            >
              Folder
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setCurlModal(true);
              }}
            >
              Import from cURL
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setViewCollectionModal(true);
              }}
            >
              Import collection
            </button>
          </li>
        </ul>
      </div>
      <RecipeCloudContext.Provider value={recipeCloud}>
        <ul className="menu py-0">
          {rootFolderSessionsExtended.map((folder) => {
            return (
              <SessionFolder key={folder.id} folder={folder} isRootFolder />
            );
          })}
        </ul>
      </RecipeCloudContext.Provider>
      {/* This is the base folder. It has no names. No indentation */}
      {noFolderSessions.length > 0 && (
        <div>
          <div className="text-start py-2 w-full">
            <h3 className="font-bold text-xs ml-4">
              {rootFolderSessionsExtended.length !== 0
                ? "No Folder"
                : "Sessions"}
            </h3>
          </div>
          <ul className="menu py-0 w-full">
            {noFolderSessions.map((session) => (
              <SessionTab key={session.id} session={session} />
            ))}
          </ul>
        </div>
      )}

      {curlModal && <CurlModal onClose={() => setCurlModal(false)} />}
      {viewCollectionModal && (
        <ViewCollectionModal onClose={() => setViewCollectionModal(false)} />
      )}
      {addFolderModal && (
        <FolderModal onClose={() => setAddFolderModal(false)} />
      )}
    </div>
  );
}
