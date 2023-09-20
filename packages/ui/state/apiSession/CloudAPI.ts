import {
  CloudStore,
  getCloudStore,
  getConfigForSessionStore,
  getSessionsFromStore,
  saveSessionToStore,
  setConfigForSessionStore,
  setParametersForSessionStore,
} from ".";
import { FolderAPI } from "./FolderAPI";
import { RecipeSession, useRecipeSessionStore } from "../recipeSession";
import { getConfigFromRecipe } from "../../components/RecipeBody/RecipeLeftPane/RecipeForkTab";
import { createContext, useEffect, useState } from "react";
import {
  Recipe,
  RecipeProject,
  RecipeSessionFolderExtended,
} from "types/database";
import { useSupabaseClient } from "../../components/Providers/SupabaseProvider";

import EventEmitter from "events";
import { fetchUserCloud } from "../../fetchers/user";

export const cloudEventEmitter = new EventEmitter();
cloudEventEmitter.setMaxListeners(300); // Should be infinity but account for a memory leak

export class CloudAPI {
  static async getUserCloud() {
    const store = await getCloudStore();

    return store.get("cloud");
  }

  static async initializeCloud(cloud: CloudStore) {
    const store = await getCloudStore();
    await store.put(cloud, "cloud");

    let sessions = (await getSessionsFromStore()) || [];
    const apis = cloud.apis;
    await Promise.all(
      apis.map(async (api) => {
        const existingConfig = await getConfigForSessionStore({
          recipeId: api.id,
        });
        if (!existingConfig) {
          await setConfigForSessionStore(getConfigFromRecipe(api));
        }

        if (!sessions.some((session) => session.id == api.id)) {
          const newSession: RecipeSession = {
            apiMethod: api.method,
            id: api.id,
            name: api.title,
            recipeId: api.id,
          };
          sessions.push(newSession);

          await setParametersForSessionStore({
            parameters: {
              editorBody: "",
              editorHeaders: [],
              editorQuery: "",
              editorURLCode: "",
            },
            session: newSession.id,
          });
        }
      })
    );

    const collections = cloud.collections;
    let folders = await FolderAPI.getAllFolders();

    await Promise.all(
      collections.map(async (collection, i) => {
        function recursivelyInitializeFolders(
          folder: RecipeSessionFolderExtended
        ) {
          const items = folder.items;

          for (const item of items) {
            if (item.type === "session") {
              if (sessions.some((session) => session.id == item.id)) {
                continue;
              } else {
                sessions.push(item.session);
              }
            } else {
              if (folders.some((folder) => folder.id == item.id)) continue;

              recursivelyInitializeFolders(item.folder);

              folders.push({
                ...item.folder,
                items: item.folder.items.map((item) => ({
                  id: item.id,
                  type: item.type,
                })),
              });
            }
          }
        }

        if (collection.folder) {
          recursivelyInitializeFolders(collection.folder);
        }
      })
    );

    await saveSessionToStore(sessions);
    await FolderAPI.setFolders(folders);

    cloudEventEmitter.emit("refreshSidebar");
    cloudEventEmitter.emit("refreshCloud");
  }

  static async resetCloud() {
    const store = await getCloudStore();

    await store.delete("cloud");
    cloudEventEmitter.emit("refreshCloud");
  }
}

export function useRecipeCloud() {
  const [cloud, setCloud] = useState<CloudStore>();
  const [collectionRecord, setCollectionRecord] = useState<{
    [key: string]: RecipeProject | undefined;
  }>({});
  const [folderToCollection, setFolderToCollection] = useState<{
    [key: string]: string;
  }>({});
  const [apiRecord, setAPIRecord] = useState<{
    [key: string]: Recipe | undefined;
  }>({});

  const [collectionToApis, setCollectionToApis] = useState<{
    [key: string]: string[];
  }>({});

  const supabase = useSupabaseClient();
  const user = useRecipeSessionStore((state) => state.user);

  useEffect(() => {
    async function refreshCloud() {
      const cloud = await CloudAPI.getUserCloud();

      const collectionRecord: { [key: string]: RecipeProject } = {};
      const apiRecord: { [key: string]: Recipe } = {};
      const collectionToApis: { [key: string]: string[] } = {};
      const folderToCollection: { [key: string]: string } = {};

      cloud?.collections.forEach((collection) => {
        collectionRecord[collection.id] = collection;

        function recursivelyCheckFolders(folder: RecipeSessionFolderExtended) {
          const items = folder.items;
          for (const item of items) {
            if (item.type === "session") {
              continue;
            } else {
              folderToCollection[item.id] = collection.id;
              recursivelyCheckFolders(item.folder);
            }
          }
        }

        if (collection.folder) {
          recursivelyCheckFolders(collection.folder);
        }
      });

      cloud?.apis.forEach((api) => {
        apiRecord[api.id] = api;

        if (!collectionToApis[api.project]) {
          collectionToApis[api.project] = [];
        }

        collectionToApis[api.project].push(api.id);
      });

      setCollectionRecord(collectionRecord);
      setAPIRecord(apiRecord);
      setCollectionToApis(collectionToApis);
      setCloud(cloud);
      setFolderToCollection(folderToCollection);
    }

    cloudEventEmitter.on("refreshCloud", refreshCloud);
    refreshCloud();

    return () => {
      cloudEventEmitter.off("refreshCloud", refreshCloud);
    };
  }, []);

  useEffect(() => {
    async function syncCloud() {
      if (!user) return;
      fetchUserCloud({ supabase, user_id: user.user_id }).then((cloudInfo) => {
        CloudAPI.initializeCloud(cloudInfo);
      });
    }

    cloudEventEmitter.on("syncCloud", syncCloud);

    return () => {
      cloudEventEmitter.off("syncCloud", syncCloud);
    };
  }, [supabase, user]);

  return {
    cloud,
    apiRecord,
    collectionRecord,
    collectionToApis,
    folderToCollection,
  };
}

export const RecipeCloudContext = createContext<
  ReturnType<typeof useRecipeCloud>
>(undefined as any);
