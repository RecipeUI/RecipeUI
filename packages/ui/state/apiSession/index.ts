"use client";

import { JSONSchema6 } from "json-schema";
import {
  Recipe,
  RecipeProject,
  RecipeTemplate,
  RecipeTemplateFragment,
  RequestHeader,
  UserTemplatePreview,
} from "types/database";
import {
  ProjectScope,
  RecipeAuthType,
  RecipeMethod,
  RecipeMutationContentType,
} from "types/enums";
import { openDB, DBSchema } from "idb";
import {
  FetchResponse,
  RecipeSession,
  RecipeSessionFolder,
  SessionOutput,
} from "../recipeSession";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface APISessionParameters {
  editorBody: string;
  editorQuery: string;
  editorHeaders: RequestHeader[];
}

interface APISessionConfig {
  editorUrl: string;
  editorMethod: RecipeMethod;

  editorBodyType: RecipeMutationContentType | null;
  editorBodySchemaType: string | null;
  editorBodySchemaJSON: JSONSchema6 | null;

  editorQuerySchemaType: string | null;
  editorQuerySchemaJSON: JSONSchema6 | null;

  editorAuth: {
    meta?: string;
    type: RecipeAuthType;
    docs?: string;
  } | null;
  editorHeader: {
    title: string;
    description: string;
  };

  editorURLCode: string;
  editorURLSchemaType: string | null;
  editorURLSchemaJSON: JSONSchema6 | null;
  editorProject?: string | null;
  editorSessionOptions?: EditorSessionOptions;
}

export interface EditorSessionOptions {
  ignoreProject?: string;
}

enum APIStore {
  Parameters = "Parameters",
  Config = "Config",
  Sessions = "Sessions",
  SessionFolders = "SessionFolders",
  Secrets = "Secrets",
  Output = "Output",
  MiniRecipes = "MiniRecipes",
  ProjectCollections = "ProjectCollections",
  RecipeUICollections = "RecipeUICollections",
  Onboarding = "Onboarding",
}

export interface SessionsStore extends DBSchema {
  [APIStore.Parameters]: {
    key: string;
    value: APISessionParameters;
  };
  [APIStore.Config]: {
    key: string;
    value: APISessionConfig;
  };
  [APIStore.MiniRecipes]: {
    key: string;
    value: RecipeTemplateFragment[];
  };
  [APIStore.Sessions]: {
    key: "sessions";
    value: RecipeSession[];
  };
  [APIStore.SessionFolders]: {
    key: "sessionFolders";
    value: RecipeSessionFolder[];
  };
  [APIStore.Secrets]: {
    key: string;
    value: string;
  };
  [APIStore.Output]: {
    key: string;
    value: SessionOutput[];
  };
  [APIStore.RecipeUICollections]: {
    key: CollectionType;
    value: {
      collections: RecipeProject[];
      recipes: Recipe[];
    };
  };

  [APIStore.Onboarding]: {
    key: OnboardingKey;
    value: boolean;
  };
}

const DB_CONFIG = {
  NAME: "RECIPEUI_ALPHA_0.5",
  // TODO: Need a better migration plan this is bad
  VERSION: 5,
};
let db: undefined | ReturnType<typeof openDB<SessionsStore>>;

function getDB() {
  if (!db) {
    db = openDB<SessionsStore>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
      upgrade(db, old, newVersion, transaction) {
        [
          APIStore.Parameters,
          APIStore.Config,
          APIStore.Sessions,
          APIStore.Secrets,
          APIStore.Output,
          APIStore.MiniRecipes,
          APIStore.SessionFolders,
          APIStore.RecipeUICollections,
          APIStore.Onboarding,
        ].forEach((store) => {
          if (!db.objectStoreNames.contains(store as any)) {
            db.createObjectStore(store as any);
          }
        });
      },
    });
  }

  return db;
}

export function initializeDB() {
  return getDB();
}

async function getParameterStore() {
  return (await getDB()).transaction(APIStore.Parameters, "readwrite").store;
}

async function getConfigStore() {
  return (await getDB()).transaction(APIStore.Config, "readwrite").store;
}

export async function getSecretStore() {
  return (await getDB()).transaction(APIStore.Secrets, "readwrite").store;
}

export async function getOutputStore() {
  return (await getDB()).transaction(APIStore.Output, "readwrite").store;
}

export async function getFolderStore() {
  return (await getDB()).transaction(APIStore.SessionFolders, "readwrite")
    .store;
}

export async function getOnboardingStore() {
  return (await getDB()).transaction(APIStore.Onboarding, "readwrite").store;
}
export async function getRecipeUICollectionStore() {
  return (await getDB()).transaction(APIStore.RecipeUICollections, "readwrite")
    .store;
}

export async function getSessionsFromStore() {
  return (await getDB())
    .transaction(APIStore.Sessions, "readwrite")
    .store.get("sessions");
}

export async function saveSessionToStore(sessions: RecipeSession[]) {
  return (await getDB())
    .transaction(APIStore.Sessions, "readwrite")
    .store.put(sessions, "sessions");
}

export async function setParametersForSessionStore({
  session,
  parameters,
}: {
  session: string;
  parameters: APISessionParameters;
}) {
  const store = await getParameterStore();
  return store.put(parameters, session);
}

export async function deleteSession({
  sessionId,
  recipeId,
}: {
  sessionId: string;
  recipeId: string;
}) {
  await deleteParametersForSessionStore({ session: sessionId });
  await deleteConfigForSessionStore({ recipeId: recipeId });
  await OutputAPI.clearOutput(sessionId);
}

export async function deleteParametersForSessionStore({
  session,
}: {
  session: string;
}) {
  const store = await getParameterStore();
  return store.delete(session);
}

export async function getParametersForSessionStore({
  session,
}: {
  session: string;
}) {
  const store = await getParameterStore();
  return store.get(session);
}

export async function setConfigForSessionStore({
  recipeId,
  config,
}: {
  recipeId: string | number;
  config: APISessionConfig;
}) {
  const store = await getConfigStore();
  return store.put(config, String(recipeId)) || {};
}

export async function getConfigForSessionStore({
  recipeId,
}: {
  recipeId: string | number;
}) {
  const store = await getConfigStore();
  return store.get(String(recipeId));
}

// We can also delete the miniRecipes
export async function deleteConfigForSessionStore({
  recipeId,
}: {
  recipeId: string;
}) {
  // We need to be careful here. We should check first if there are any sessions that rely on these
  const sessions = await getSessionsFromStore();

  const sessionsWithRecipeId = sessions!.filter(
    (session) => session.recipeId === recipeId
  ).length;

  if (sessionsWithRecipeId <= 1) {
    const configStore = await getConfigStore();

    const miniRecipeStore = await getMiniRecipeStore();

    configStore.delete(String(recipeId));
    miniRecipeStore.delete(String(recipeId));
    SecretAPI.deleteSecret({ secretId: recipeId });
  }
}

import EventEmitter from "events";
import { OutputAPI } from "./OutputAPI";
import { SecretAPI } from "./SecretAPI";
import { CollectionType, OnboardingKey } from "utils/constants";
export const eventEmitter = new EventEmitter();

async function getMiniRecipeStore() {
  return (await getDB()).transaction(APIStore.MiniRecipes, "readwrite").store;
}

export async function getMiniRecipes(recipeId: string) {
  const store = await getMiniRecipeStore();
  return store.get(recipeId);
}

export async function initializeRecipeList(
  recipe: Recipe,
  newMiniRecipes: RecipeTemplate[]
) {
  const store = await getMiniRecipeStore();

  const miniRecipes: RecipeTemplateFragment[] = newMiniRecipes.map(
    (miniRecipe) => {
      return {
        description: miniRecipe.description,
        title: miniRecipe.title,
        method: recipe.method,
        project: recipe.project,
        project_scope: ProjectScope.Personal,

        queryParams: miniRecipe.queryParams,
        requestBody: miniRecipe.requestBody,
        urlParams: miniRecipe.urlParams,
        replay: miniRecipe.replay,

        created_at: recipe.created_at || new Date().toISOString(),
        id: uuidv4(),
        headers: null,
        recipe_id: recipe.id,
        original_author_id: null,
      };
    }
  );

  await store.put(miniRecipes, recipe.id);
  eventEmitter.emit("refreshRecipes");
}

export class MiniRecipeAPI {
  static addRecipe = async (
    mainRecipeId: string,
    newMiniRecipe: RecipeTemplateFragment
  ) => {
    const store = await getMiniRecipeStore();
    const recipes = await store.get(mainRecipeId);
    const newRecipes = [...(recipes || []), newMiniRecipe];

    await store.put(newRecipes, mainRecipeId);
    eventEmitter.emit("refreshRecipes");
  };
}

export function useMiniRecipes(primaryRecipeId?: string) {
  const [recipes, setRecipes] = useState<RecipeTemplateFragment[]>([]);

  useEffect(() => {
    function refreshRecipes() {
      if (primaryRecipeId)
        getMiniRecipes(primaryRecipeId).then((output) =>
          setRecipes(output || [])
        );
    }

    refreshRecipes();

    eventEmitter.on("refreshRecipes", refreshRecipes);
    return () => {
      eventEmitter.off("refreshRecipes", refreshRecipes);
    };
  }, [primaryRecipeId]);

  const deleteRecipe = useCallback(
    async (miniRecipeIdToDelete: string) => {
      if (!primaryRecipeId) return;

      const store = await getMiniRecipeStore();
      const recipes = await store.get(primaryRecipeId);
      const newRecipes = (recipes || []).filter(
        (recipe) => recipe.id !== miniRecipeIdToDelete
      );
      await store.put(newRecipes, primaryRecipeId);
      eventEmitter.emit("refreshRecipes");
    },
    [primaryRecipeId]
  );

  return {
    recipes,
    deleteRecipe,
  };
}

export async function getSessionRecord() {
  const sessions = (await getSessionsFromStore()) || [];

  const sessionRecord: {
    [key: string]: RecipeSession;
  } = {};

  for (const session of sessions) {
    sessionRecord[session.id] = session;
  }

  return sessionRecord;
}
