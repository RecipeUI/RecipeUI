import {
  CloudStore,
  eventEmitter,
  getCloudStore,
  getConfigForSessionStore,
  getSessionsFromStore,
  saveSessionToStore,
  setConfigForSessionStore,
  setParametersForSessionStore,
} from ".";
import { FolderAPI } from "./FolderAPI";
import {
  RecipeSession,
  RecipeSessionFolder,
  useRecipeSessionStore,
} from "../recipeSession";
import { getConfigFromRecipe } from "../../components/RecipeBody/RecipeLeftPane/RecipeForkTab";
import { useEffect, useState } from "react";
import { Recipe, RecipeProject } from "types/database";
import { useSupabaseClient } from "../../components/Providers/SupabaseProvider";
import { fetchUserCloud } from "../../fetchers/user";

export class CloudAPI {
  static async getUserCloud() {
    const store = await getCloudStore();

    return store.get("cloud");
  }

  static async initializeCloud(cloud: CloudStore) {
    const store = await getCloudStore();

    await store.put(cloud, "cloud");
    const sessions = (await getSessionsFromStore()) || [];

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
    const folders = await FolderAPI.getAllFolders();

    await Promise.all(
      collections.map(async (collection, i) => {
        let sessionFolder = folders.find(
          (folder) => folder.id === collection.id
        );

        let apis = cloud.apis.filter((api) => {
          if (api.project !== collection.project) {
            return false;
          }

          if (sessionFolder && sessionFolder.sessionIds.includes(api.id)) {
            return false;
          }

          return true;
        });

        if (!sessionFolder) {
          const newSessionFolder: RecipeSessionFolder = {
            id: collection.id,
            name: collection.title,
            sessionIds: apis.map((api) => api.id),
          };

          folders.push(newSessionFolder);
          sessionFolder = newSessionFolder;
        } else {
          sessionFolder.sessionIds.push(...apis.map((api) => api.id));
        }

        for (const api of apis) {
          const existingSession = sessions.find(
            (session) => session.recipeId === api.id && session.id === api.id
          );

          if (existingSession) continue;
          const newSession = {
            apiMethod: api.method,
            id: api.id,
            name: api.title,
            recipeId: api.id,
            folderId: sessionFolder.id,
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

    await saveSessionToStore(sessions);
    await FolderAPI.setFolders(folders);

    eventEmitter.emit("refreshSidebar");
    eventEmitter.emit("refreshCloud");
  }

  static async resetCloud() {
    const store = await getCloudStore();

    await store.delete("cloud");
    eventEmitter.emit("refreshCloud");
  }
}

export function useRecipeCloud() {
  const [cloud, setCloud] = useState<CloudStore>();
  const [collectionRecord, setCollectionRecord] = useState<{
    [key: string]: RecipeProject | undefined;
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
    if (user?.user_id) {
      fetchUserCloud({ supabase, user_id: user?.user_id }).then((cloudInfo) => {
        CloudAPI.initializeCloud(cloudInfo);
      });
    }
  }, [supabase, user]);

  useEffect(() => {
    async function refreshCloud() {
      const cloud = await CloudAPI.getUserCloud();

      const collectionRecord: { [key: string]: RecipeProject } = {};
      const apiRecord: { [key: string]: Recipe } = {};
      const collectionToApis: { [key: string]: string[] } = {};

      cloud?.collections.forEach((collection) => {
        collectionRecord[collection.id] = collection;
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
    }

    eventEmitter.on("refreshCloud", refreshCloud);
    refreshCloud();

    return () => {
      eventEmitter.off("refreshCloud", refreshCloud);
    };
  }, []);

  return {
    cloud,
    apiRecord,
    collectionRecord,
    collectionToApis,
  };
}
