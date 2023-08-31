"use client";

import { JSONSchema6 } from "json-schema";
import {
  RecipeOutputType,
  RecipeTemplateFragment,
  RequestHeader,
} from "types/database";
import {
  RecipeAuthType,
  RecipeMethod,
  RecipeMutationContentType,
} from "types/enums";
import { openDB, DBSchema } from "idb";
import {
  RecipeSession,
  RecipeSessionFolder,
  SessionOutput,
} from "./recipeSession";
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
    value: SessionOutput;
  };
}

const DB_CONFIG = {
  NAME: "RECIPEUI_ALPHA",
  // TODO: Need a better migration plan this is bad
  VERSION: 1,
};
let db: undefined | ReturnType<typeof openDB<SessionsStore>>;

function getDB() {
  if (!db) {
    db = openDB<SessionsStore>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
      upgrade(db) {
        // TODO: Need a better migration plan this is bad
        db.clear(APIStore.Parameters);
        db.clear(APIStore.Config);
        db.clear(APIStore.Sessions);
        db.clear(APIStore.Secrets);
        db.clear(APIStore.Output);
        db.clear(APIStore.MiniRecipes);
        db.clear(APIStore.SessionFolders);

        db.createObjectStore(APIStore.Parameters);
        db.createObjectStore(APIStore.Config);
        db.createObjectStore(APIStore.Sessions);
        db.createObjectStore(APIStore.SessionFolders);
        db.createObjectStore(APIStore.Secrets);
        db.createObjectStore(APIStore.Output);
        db.createObjectStore(APIStore.MiniRecipes);
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

async function getSecretStore() {
  return (await getDB()).transaction(APIStore.Secrets, "readwrite").store;
}

async function getOutputStore() {
  return (await getDB()).transaction(APIStore.Output, "readwrite").store;
}

async function getFolderStore() {
  return (await getDB()).transaction(APIStore.SessionFolders, "readwrite")
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

export async function deleteConfigForSessionStore({
  recipeId,
}: {
  recipeId: string | number;
}) {
  // We need to be careful here. We should check first if there are any sessions that rely on these
  const sessions = await getSessionsFromStore();

  const sessionsWithRecipeId = sessions!.filter(
    (session) => session.recipeId === recipeId
  ).length;

  if (sessionsWithRecipeId === 1) {
    const store = await getConfigStore();
    return store.delete(String(recipeId));
  }
}

export async function getSecret({
  secretId,
}: {
  secretId: string;
}): Promise<string | undefined> {
  const store = await getSecretStore();
  return store.get(String(secretId));
}

interface SaveSecret {
  secretId: string;
  secretValue: string;
}
export async function saveSecret({ secretId, secretValue }: SaveSecret) {
  const store = await getSecretStore();
  store.put(secretValue, String(secretId));
}

export async function deleteSecret({ secretId }: { secretId: string }) {
  const store = await getSecretStore();
  store.delete(String(secretId));
}

export function useSecret(secretId: string) {
  const [secret, setSecret] = useState<string | undefined>(undefined);

  useEffect(() => {
    getSecret({ secretId }).then((secret) => setSecret(secret));
  }, [secretId]);

  const _updateSecret = useCallback(
    ({ secretValue }: SaveSecret) => {
      saveSecret({ secretId, secretValue });
      setSecret(secretValue);
    },
    [secretId]
  );

  const _deleteSecret = useCallback(() => {
    deleteSecret({ secretId });
    setSecret(undefined);
  }, [secretId]);

  return {
    secret,
    updateSecret: _updateSecret,
    deleteSecret: _deleteSecret,
  };
}

async function getOutput(sessionId?: string) {
  if (!sessionId) return undefined;

  const store = await getOutputStore();
  return store.get(sessionId);
}

async function updateOutput({
  sessionId,
  sessionOutput,
}: {
  sessionId: string;
  sessionOutput: SessionOutput;
}) {
  const store = await getOutputStore();
  store.put(sessionOutput, sessionId);
}

async function clearOutput(sessionId: string) {
  const store = await getOutputStore();
  store.delete(sessionId);
}

import EventEmitter from "events";
const eventEmitter = new EventEmitter();

const DEFAULT_OUTPUT: SessionOutput = {
  output: {},
  type: RecipeOutputType.Void,
};
export function useOutput(sessionId?: string) {
  const [output, _setOutput] = useState<SessionOutput>(DEFAULT_OUTPUT);

  useEffect(() => {
    function refreshState() {
      getOutput(sessionId).then((output) =>
        _setOutput(output || DEFAULT_OUTPUT)
      );
    }

    refreshState();

    // EventEmitters might be overkill because you can do context, but wanted to try this out!!!
    eventEmitter.on("refreshState", refreshState);
    return () => {
      eventEmitter.off("refreshState", refreshState);
    };
  }, [sessionId]);

  const setOutput = useCallback(
    async (output: SessionOutput, mock?: boolean) => {
      if (sessionId) {
        await updateOutput({
          sessionId,
          sessionOutput: {
            ...output,

            ...(!mock
              ? {
                  created_at: new Date().toISOString(),
                }
              : null),
          },
        });
      }
      eventEmitter.emit("refreshState");
    },
    [sessionId]
  );

  const clear = useCallback(async () => {
    if (sessionId) {
      await clearOutput(sessionId);
    }

    eventEmitter.emit("refreshState");
  }, [sessionId]);

  return {
    output,
    setOutput,
    clearOutput: clear,
  };
}

async function getMiniRecipeStore() {
  return (await getDB()).transaction(APIStore.MiniRecipes, "readwrite").store;
}

async function getRecipes(recipeId: string) {
  const store = await getMiniRecipeStore();
  return store.get(recipeId);
}

export function useMiniRecipes(primaryRecipeId?: string) {
  const [recipes, setRecipes] = useState<RecipeTemplateFragment[]>([]);

  useEffect(() => {
    function refreshRecipes() {
      if (primaryRecipeId)
        getRecipes(primaryRecipeId).then((output) => setRecipes(output || []));
    }

    refreshRecipes();

    eventEmitter.on("refreshRecipes", refreshRecipes);
    return () => {
      eventEmitter.off("refreshRecipes", refreshRecipes);
    };
  }, [primaryRecipeId]);

  const addRecipe = useCallback(
    async (newMiniRecipe: RecipeTemplateFragment) => {
      if (!primaryRecipeId) return;

      const store = await getMiniRecipeStore();
      const recipes = await store.get(primaryRecipeId);
      const newRecipes = [...(recipes || []), newMiniRecipe];
      await store.put(newRecipes, primaryRecipeId);
      eventEmitter.emit("refreshRecipes");
    },
    [primaryRecipeId]
  );

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
    addRecipe,
    deleteRecipe,
  };
}

export function useSessionFolders() {
  const [folders, setFolders] = useState<RecipeSessionFolder[]>([]);

  useEffect(() => {
    async function refreshFolders() {
      const store = await getFolderStore();
      const folders = await store.get("sessionFolders");
      setFolders(folders || []);
    }

    refreshFolders();

    eventEmitter.on("refreshFolders", refreshFolders);
    return () => {
      eventEmitter.off("refreshFolders", refreshFolders);
    };
  }, []);

  const addFolder = useCallback(async (folderName: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
    const newFolders = [
      ...(folders || []),
      {
        id: uuidv4(),
        name: folderName,
        sessionIds: [],
      } as RecipeSessionFolder,
    ];
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  }, []);

  const editFolderName = useCallback(async (folderId: string, name: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
    const newFolders = (folders || []).map((folder) => {
      if (folder.id !== folderId) return folder;
      return {
        ...folder,
        name,
      };
    });
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  }, []);

  const addSessionToFolder = useCallback(
    async (sessionId: string, folderId: string) => {
      const store = await getFolderStore();
      const folders = await store.get("sessionFolders");

      const newFolders = (folders || []).map((folder) => {
        if (folder.id !== folderId) return folder;
        return {
          ...folder,
          sessionIds: [...folder.sessionIds, sessionId],
        };
      });
      await store.put(newFolders, "sessionFolders");
      eventEmitter.emit("refreshFolders");
    },
    []
  );

  const deleteSessionFromFolder = useCallback(async (sessionId: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");

    const newFolders = (folders || []).map((folder) => {
      return {
        ...folder,
        sessionIds: folder.sessionIds.filter((id) => id !== sessionId),
      };
    });

    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  }, []);

  const removeFolder = useCallback(async (folderId: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
    const newFolders = (folders || []).filter(
      (folder) => folder.id !== folderId
    );
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  }, []);

  return {
    folders,
    editFolderName,
    addFolder,
    removeFolder,
    addSessionToFolder,
    deleteSessionFromFolder,
  };
}
