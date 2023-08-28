import { JSONSchema6 } from "json-schema";
import { RequestHeader } from "types/database";
import {
  RecipeAuthType,
  RecipeMethod,
  RecipeMutationContentType,
} from "types/enums";
import { openDB, DBSchema } from "idb";
import { RecipeSession, RecipeSessionFolder } from "./recipeSession";

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
  editorBodySchemaJSON: JSONSchema6;
  editorQuerySchemaType: string;
  editorQuerySchemaJSON: JSONSchema6;
  editorAuth: {
    meta?: string;
    type: RecipeAuthType;
    docs?: string;
  } | null;
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
const db = openDB<SessionsStore>(DB_CONFIG.NAME, DB_CONFIG.VERSION, {
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

async function getParameterStore() {
  return (await db).transaction(APIStore.Parameters, "readwrite").store;
}

async function getConfigStore() {
  return (await db).transaction(APIStore.Config, "readwrite").store;
}

async function getSecretStore() {
  return (await db).transaction(APIStore.Secrets, "readwrite").store;
}

export async function getSessionsFromStore() {
  console.log("Store", (await db).name);
  return (await db)
    .transaction(APIStore.Sessions, "readwrite")
    .store.get("sessions");
}

export async function saveSessionToStore(sessions: RecipeSession[]) {
  return (await db)
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
  const store = await getConfigStore();
  return store.delete(String(recipeId));
}

export async function getSecret({
  secretId,
}: {
  secretId: string | number;
}): Promise<string | undefined> {
  const store = await getSecretStore();
  return store.get(String(secretId));
}

export async function saveSecret({
  secretId,
  secretValue,
}: {
  secretId: string | number;
  secretValue: string;
}) {
  const store = await getSecretStore();
  store.put(secretValue, String(secretId));
}

export async function deleteSecret({
  secretId,
}: {
  secretId: string | number;
}) {
  const store = await getSecretStore();
  store.delete(String(secretId));
}
