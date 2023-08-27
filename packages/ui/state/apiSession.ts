import { JSONSchema6 } from "json-schema";
import { RequestHeader } from "types/database";
import { RecipeMethod, RecipeMutationContentType } from "types/enums";
import { openDB, DBSchema, IDBPDatabase } from "idb";
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
}

enum APIStore {
  Parameters = "Parameters",
  Config = "Config",
  Sessions = "Sessions",
  SessionFolders = "SessionFolders",
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
}

const DB_CONFIG = {
  NAME: "RECIPEUI_v1",
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

    db.createObjectStore(APIStore.Parameters);
    db.createObjectStore(APIStore.Config);
    db.createObjectStore(APIStore.Sessions);
    db.createObjectStore(APIStore.SessionFolders);
  },
});

async function getParameterStore() {
  return (await db).transaction(APIStore.Parameters, "readwrite").store;
}

async function getConfigStore() {
  return (await db).transaction(APIStore.Config, "readwrite").store;
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

export async function setParametersForSessionStore(
  session: string,
  parameters: APISessionParameters
) {
  const store = await getParameterStore();
  return store.put(parameters, session);
}

export async function deleteParametersForSessionStore(session: string) {
  const store = await getParameterStore();
  return store.delete(session);
}

export async function getParametersForSessionStore(session: string) {
  const store = await getParameterStore();
  return store.get(session);
}

export async function setConfigForSessionStore(
  session: string,
  config: APISessionConfig
) {
  const store = await getConfigStore();
  return store.put(config, session) || {};
}

export async function getConfigForSessionStore(session: string) {
  const store = await getConfigStore();
  return store.get(session);
}

export async function deleteConfigForSessionStore(session: string) {
  const store = await getConfigStore();
  return store.delete(session);
}
