"use client";

import { JSONSchema6 } from "json-schema";
import { RequestHeader } from "types/database";
import {
  RecipeAuthType,
  RecipeMethod,
  RecipeMutationContentType,
} from "types/enums";
import { openDB, DBSchema } from "idb";
import { RecipeSession, RecipeSessionFolder } from "./recipeSession";
import { useCallback, useEffect, useState } from "react";

interface APISessionParameters {
  editorBody: string;
  editorQuery: string;
  editorHeaders: RequestHeader[];
}

interface APISessionConfig {
  editorUrl: string;
  editorMethod: RecipeMethod;
  editorBodyType: RecipeMutationContentType | null;
  editorBodySchemaType: string;
  editorBodySchemaJSON: JSONSchema6 | null;
  editorQuerySchemaType: string;
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
}

enum APIStore {
  Parameters = "Parameters",
  Config = "Config",
  Sessions = "Sessions",
  SessionFolders = "SessionFolders",
  Secrets = "Secrets",
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
}

const DB_CONFIG = {
  NAME: "RECIPEUI_v1.1",
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
        db.clear(APIStore.SessionFolders);
        db.clear(APIStore.Secrets);

        db.createObjectStore(APIStore.Parameters);
        db.createObjectStore(APIStore.Config);
        db.createObjectStore(APIStore.Sessions);
        db.createObjectStore(APIStore.SessionFolders);
        db.createObjectStore(APIStore.Secrets);
      },
    });
  }

  return db;
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
