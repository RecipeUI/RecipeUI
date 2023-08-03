import { StateCreator, create } from "zustand";
import _recipes from "../assets/recipes.json";
import { Recipe } from "../types/recipes";
import { produce } from "immer";
import { getArrayPathIndex, isArrayPath } from "../utils/main";
import { v4 as uuidv4 } from "uuid";
import { useEffect } from "react";
import { useInterval, useLocalStorage } from "usehooks-ts";

const recipes = [...(_recipes as Recipe[])];

export interface RecipeSession {
  id: string;
  name: string;
  recipe: Recipe;
}

interface RecipeSessionSlice {
  currentSession: RecipeSession | null;
  sessions: RecipeSession[];

  setSessions: (sessions: RecipeSession[]) => void;
  setCurrentSession: (session: RecipeSession | null) => void;
  updateSessionName: (session: RecipeSession, name: string) => void;

  addSession: (selectedRecipe: Recipe) => void;
  closeSession: (session: RecipeSession) => void;
}

export enum RecipeBodyRoute {
  Parameters = "Parameters",
  Examples = "Examples",
  Config = "Config",
}

export enum RecipeOutputType {
  Response = "Response",
  Error = "Error",
}

export enum RecipeOutputTab {
  Output = "Output",
  Docs = "Docs",
}

interface RecipeOutputSlice {
  output: Record<string, unknown>;
  outputType: RecipeOutputType;
  setOutput: (params: {
    output: Record<string, unknown>;
    outputType: RecipeOutputType;
  }) => void;

  outputTab: RecipeOutputTab;
  setOutputTab: (tab: RecipeOutputTab) => void;

  clearOutput: () => void;
}

interface RecipeBodySlice {
  bodyRoute: RecipeBodyRoute;
  setBodyRoute: (route: RecipeBodyRoute) => void;
  recipes: Recipe[];

  requestBody: Record<string, unknown>;
  setRequestBody: (requestBody: Record<string, unknown>) => void;
  updateRequestBody: (updateProps: { path: string; value: unknown }) => void;
}

interface FileManagerSlice {
  fileManager: Record<string, File>;
  updateFileManager: (path: string, file: File) => void;
  deleteFileManager: (path: string) => void;
}

type Slices = RecipeSessionSlice &
  RecipeBodySlice &
  RecipeOutputSlice &
  FileManagerSlice;

export interface LocalStorageState {
  sessions: RecipeSession[];
  currentSession: RecipeSessionSlice["currentSession"];
  requestBody: Record<string, unknown>;
}

const createRecipeSessionSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeSessionSlice
> = (set) => {
  return {
    currentSession: null,
    sessions: [],
    setSessions: (sessions) => set(() => ({ sessions })),

    // TODO: Need a more failsafe way of doing this....
    // IT IS IMPORTANT TO PRESERVE THE CURRENT SESSION REQUEST LOCALLY WHEN CHANGING SESSIONS
    setCurrentSession: (session) =>
      set((prevState) => {
        if (prevState.currentSession) {
          preserveSessionIdRequestToLocal({
            sessionId: prevState.currentSession.id,
            requestBody: prevState.requestBody,
          });
        }

        const requestBody = session
          ? retrieveRequestForSessionIdFromLocal(session.id)
          : {};

        return {
          currentSession: session,
          requestBody,
          bodyRoute: RecipeBodyRoute.Parameters,
        };
      }),

    updateSessionName: (session, name) =>
      set((prevState) => {
        const sessions = prevState.sessions.map((s) => {
          if (s.id === session.id) {
            return {
              ...s,
              name,
            };
          }
          return s;
        });

        return {
          sessions,
        };
      }),

    addSession: (selectedRecipe) =>
      set((prevState) => {
        if (prevState.currentSession) {
          preserveSessionIdRequestToLocal({
            sessionId: prevState.currentSession.id,
            requestBody: prevState.requestBody,
          });
        }

        const newSession: RecipeSession = {
          id: uuidv4(),
          name: selectedRecipe.title,
          recipe: selectedRecipe,
        };

        return {
          bodyRoute: RecipeBodyRoute.Parameters,
          currentSession: newSession,
          sessions: [...prevState.sessions, newSession],
          requestBody: {},
          outputTab: RecipeOutputTab.Docs,
        };
      }),
    closeSession: (session) =>
      set((prevState) => {
        deleteRequestForSessionIdFromLocal(session.id);

        let nextSessionIndex = -1;
        const sessions = prevState.sessions.filter((s, i) => {
          if (s.id === session.id) {
            if (prevState.sessions[i - 1]) nextSessionIndex = i - 1;
            if (prevState.sessions[i + 1]) nextSessionIndex = i + 1;

            return false;
          }

          return true;
        });

        const nextSession = prevState.sessions[nextSessionIndex];

        if (!nextSession) {
          return {
            currentSession: null,
            sessions,
          };
        }

        const requestBody = nextSession
          ? retrieveRequestForSessionIdFromLocal(nextSession.id)
          : {};

        return {
          bodyRoute: RecipeBodyRoute.Parameters,
          currentSession: nextSession,
          sessions,
          requestBody,
        };
      }),
  };
};

const createRecipeBodySlice: StateCreator<Slices, [], [], RecipeBodySlice> = (
  set
) => {
  return {
    bodyRoute: RecipeBodyRoute.Parameters,
    setBodyRoute: (route) => set(() => ({ bodyRoute: route })),

    recipes,

    // sessionToRequestBody:
    requestBody: {},
    setRequestBody: (requestBody) => set(() => ({ requestBody })),
    updateRequestBody: ({ path, value }) =>
      set((prevState) => {
        const nextState = produce(prevState.requestBody, (draft) => {
          const paths = path.split(".").slice(1);

          while (paths.length > 1) {
            const current = paths.shift()!;
            draft = (
              isArrayPath(current)
                ? draft[getArrayPathIndex(current)]
                : draft[current]
            ) as typeof draft;
          }

          const finalPath = paths[0];
          if (value === undefined) {
            delete draft[finalPath];
            return;
          } else {
            if (isArrayPath(finalPath)) {
              draft[getArrayPathIndex(finalPath)] = value;
            } else {
              draft[finalPath] = value;
            }
          }
        });

        return { requestBody: nextState };
      }),
  };
};

const createRecipeOutputSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeOutputSlice
> = (set) => {
  return {
    output: {},
    // output: {
    //   id: "chatcmpl-7jBgprQuQw9HsxkUZWTcoJf8CqaGe",
    //   object: "chat.completion",
    //   created: 1691004051,
    //   model: "gpt-3.5-turbo-0613",
    //   choices: [
    //     {
    //       index: 0,
    //       message: {
    //         role: "assistant",
    //         content:
    //           "Silicon city thrives\nTech giants sculpt innovation\nSan Francisco code",
    //       },
    //       finish_reason: "stop",
    //     },
    //   ],
    //   usage: {
    //     prompt_tokens: 56,
    //     completion_tokens: 14,
    //     total_tokens: 70,
    //   },
    // },
    setOutput: ({ output, outputType }) =>
      set(() => {
        return { output, outputTab: RecipeOutputTab.Output, outputType };
      }),

    outputType: RecipeOutputType.Response,

    outputTab: RecipeOutputTab.Docs,
    setOutputTab: (tab) => set(() => ({ outputTab: tab })),

    clearOutput: () => set(() => ({ output: {} })),
  };
};

const createFileManagerSlice: StateCreator<Slices, [], [], FileManagerSlice> = (
  set
) => {
  return {
    fileManager: {},
    updateFileManager: (path, file) =>
      set((prevState) => ({
        fileManager: {
          ...prevState.fileManager,
          [path]: file,
        },
      })),
    deleteFileManager: (path) =>
      set((prevState) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [path]: _, ...nextFileManager } = prevState.fileManager;
        return { fileManager: nextFileManager };
      }),
  };
};

export const useRecipeSessionStore = create<Slices>()((...a) => ({
  ...createRecipeSessionSlice(...a),
  ...createRecipeBodySlice(...a),
  ...createRecipeOutputSlice(...a),
  ...createFileManagerSlice(...a),
}));

const GLOBAL_POLLING_FACTOR = 10000;
const SESSION_HYDRATION_KEY = "SESSION_HYDRATION_KEY";
const RECIPE_PARAMS_KEY_PREFIX = "RECIPE_PARAMS_";

function getRecipeParamsKey(recipeId: string) {
  return RECIPE_PARAMS_KEY_PREFIX + recipeId;
}

/*
This is definitely a naive, unoptimized, approach to storing data locally.

Basically, save everything relevant to use every GLOBAL_POLLING_FACTOR seconds.
*/
export function useSaveRecipeUI() {
  const [localSave, setLocalSave] = useLocalStorage<LocalStorageState | null>(
    SESSION_HYDRATION_KEY,
    {
      currentSession: null,
      sessions: [],
      requestBody: {},
    }
  );

  const sessions = useRecipeSessionStore((state) => state.sessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setSessions = useRecipeSessionStore((state) => state.setSessions);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const requestBody = useRecipeSessionStore((state) => state.requestBody);

  // On mount, hydrate from local storage
  useEffect(() => {
    console.log("Hydrating from local storage");

    if (!localSave) return;
    if (localSave.currentSession) setCurrentSession(localSave.currentSession);
    if (localSave.sessions) setSessions(localSave.sessions);
    if (localSave.requestBody) setRequestBody(localSave.requestBody);
  }, []);

  // Save changes every POLLING_FACTOR seconds
  useInterval(() => {
    setLocalSave({
      currentSession,
      sessions,
      requestBody,
    });
  }, GLOBAL_POLLING_FACTOR);
}

// We only need to save the session when we change tabs
function preserveSessionIdRequestToLocal({
  sessionId,
  requestBody,
}: {
  sessionId: string;
  requestBody: Record<string, unknown>;
}) {
  const key = getRecipeParamsKey(sessionId);
  localStorage.setItem(key, JSON.stringify(requestBody));
}

function retrieveRequestForSessionIdFromLocal(
  sessionId: string
): Record<string, unknown> {
  const key = getRecipeParamsKey(sessionId);
  return JSON.parse(localStorage.getItem(key) || "{}");
}

function deleteRequestForSessionIdFromLocal(sessionId: string) {
  const key = getRecipeParamsKey(sessionId);

  localStorage.removeItem(key);
}
