import { StateCreator, create } from "zustand";
import { produce } from "immer";
import { getArrayPathIndex, isArrayPath } from "../utils/main";
import { v4 as uuidv4 } from "uuid";

import { Recipe } from "@/types/databaseExtended";

export interface RecipeSession {
  id: string;
  name: string;
  recipe: Recipe;
}

interface RecipeSessionSlice {
  recipes: Recipe[];
  initializeRecipes: (recipes: Recipe[]) => void;

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
  Templates = "Templates",
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
export type RecipeParameters = {
  requestBody: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  urlParams: Record<string, unknown>;
};

export const getEmptyParameters = (): RecipeParameters => ({
  requestBody: {},
  queryParams: {},
  urlParams: {},
});

interface SessionOutput {
  output: Record<string, unknown>;
  type: RecipeOutputType;
}
interface RecipeOutputSlice {
  isSending: boolean;
  setIsSending: (isSending: boolean, outputTab: RecipeOutputTab) => void;

  outputManager: Record<string, SessionOutput>;
  getOutput: () => SessionOutput;
  updateOutput: (sessionId: string, sessionOutput: SessionOutput) => void;
  clearOutput: (sessionId: string) => void;

  outputTab: RecipeOutputTab;
  setOutputTab: (tab: RecipeOutputTab) => void;
}

interface RecipeBodySlice {
  bodyRoute: RecipeBodyRoute;
  setBodyRoute: (route: RecipeBodyRoute) => void;

  requestBody: Record<string, unknown>;
  setRequestBody: (requestBody: Record<string, unknown>) => void;
  updateRequestBody: (updateProps: { path: string; value: unknown }) => void;

  queryParams: Record<string, unknown>;
  setQueryParams: (queryParams: Record<string, unknown>) => void;
  updateQueryParams: (updateProps: { path: string; value: unknown }) => void;

  urlParams: Record<string, unknown>;
  setUrlParams: (urlParams: Record<string, unknown>) => void;
  updateUrlParams: (updateProps: { param: string; value: unknown }) => void;
}

interface FileManagerSlice {
  fileManager: Record<string, File>;
  updateFileManager: (path: string, file: File) => void;
  deleteFileManager: (path: string) => void;
}

export enum DeepActionType {
  UpdateRecipeInput = "UpdateRecipeInput",
}
interface UpdateRecipeInputAction {
  type: DeepActionType.UpdateRecipeInput;
  payload: string;
}

type DeepAction = UpdateRecipeInputAction;
export interface DeepActionsSlice {
  deepActions: DeepAction[];
  clearDeepAction: (type: DeepActionType) => void;
  addDeepAction: (action: DeepAction) => void;
}

type Slices = RecipeSessionSlice &
  RecipeBodySlice &
  RecipeOutputSlice &
  FileManagerSlice &
  DeepActionsSlice;

const createDeepActionSlice: StateCreator<Slices, [], [], DeepActionsSlice> = (
  set
) => {
  return {
    deepActions: [],
    clearDeepAction: (type) => {
      set((prevState) => {
        return {
          deepActions: prevState.deepActions.filter((a) => a.type !== type),
        };
      });
    },
    addDeepAction: (action) => {
      set((prevState) => {
        return {
          deepActions: [...prevState.deepActions, action],
        };
      });
    },
  };
};

export type LocalStorageState = {
  sessions: RecipeSession[];
  currentSession: RecipeSessionSlice["currentSession"];
} & RecipeParameters;

const createRecipeSessionSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeSessionSlice
> = (set) => {
  return {
    recipes: [],
    initializeRecipes: (recipes) => {
      set(() => ({ recipes }));
    },
    currentSession: null,
    sessions: [],
    setSessions: (sessions) => set(() => ({ sessions })),

    // TODO: Need a more failsafe way of doing this....
    // IT IS IMPORTANT TO PRESERVE THE CURRENT SESSION REQUEST LOCALLY WHEN CHANGING SESSIONS
    setCurrentSession: (session) =>
      set((prevState) => {
        if (prevState.currentSession) {
          preserveSessionParamsToLocal({
            sessionId: prevState.currentSession.id,
            params: {
              requestBody: prevState.requestBody,
              queryParams: prevState.queryParams,
              urlParams: prevState.urlParams,
            },
          });
        }

        const oldParams = session
          ? retrieveParamsForSessionIdFromLocal(session.id)
          : getEmptyParameters();

        const hasOutput = session
          ? prevState.outputManager[session.id] !== undefined
          : false;

        return {
          currentSession: session,
          requestBody: oldParams.requestBody,
          queryParams: oldParams.queryParams,
          bodyRoute: RecipeBodyRoute.Parameters,
          outputTab: hasOutput ? RecipeOutputTab.Output : RecipeOutputTab.Docs,
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
          preserveSessionParamsToLocal({
            sessionId: prevState.currentSession.id,
            params: {
              requestBody: prevState.requestBody,
              queryParams: prevState.queryParams,
              urlParams: prevState.urlParams,
            },
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
          outputTab: RecipeOutputTab.Docs,
          ...getEmptyParameters(),
        };
      }),
    closeSession: (session) =>
      set((prevState) => {
        deleteParamsForSessionIdFromLocal(session.id);

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

        const oldParams = nextSession
          ? retrieveParamsForSessionIdFromLocal(nextSession.id)
          : getEmptyParameters();

        return {
          bodyRoute: RecipeBodyRoute.Parameters,
          currentSession: nextSession,
          sessions,
          requestBody: oldParams.requestBody,
          queryParams: oldParams.queryParams,
        };
      }),
  };
};

const createRecipeBodySlice: StateCreator<Slices, [], [], RecipeBodySlice> = (
  set
) => {
  function updateDraftParams({
    path,
    value,
    draft,
  }: {
    path: string;
    value: unknown;
    draft: Record<string, unknown>;
  }) {
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
  }

  return {
    bodyRoute: RecipeBodyRoute.Parameters,
    setBodyRoute: (route) => set(() => ({ bodyRoute: route })),

    requestBody: {},
    setRequestBody: (requestBody) => set(() => ({ requestBody })),
    updateRequestBody: ({ path, value }) =>
      set((prevState) => {
        const nextState = produce(prevState.requestBody, (draft) => {
          updateDraftParams({ path, value, draft });
        });

        return { requestBody: nextState };
      }),

    queryParams: {},
    setQueryParams: (queryParams) => set(() => ({ queryParams })),
    updateQueryParams: ({ path, value }) =>
      set((prevState) => {
        const nextState = produce(prevState.queryParams, (draft) => {
          updateDraftParams({ path, value, draft });
        });

        return { queryParams: nextState };
      }),

    urlParams: {},
    updateUrlParams: ({ param, value }) =>
      set((prevState) => {
        return {
          urlParams: {
            ...prevState.urlParams,
            [param]: value,
          },
        };
      }),
    setUrlParams: (urlParams) => set(() => ({ urlParams })),
  };
};

const createRecipeOutputSlice: StateCreator<
  Slices,
  [],
  [],
  RecipeOutputSlice
> = (set, get) => {
  return {
    isSending: false,
    setIsSending: (isSending, outputTab) =>
      set(() => ({
        isSending,
        outputTab,
      })),

    outputManager: {},
    getOutput: () => {
      const state = get();

      return (
        state.outputManager[state.currentSession?.id || ""] || {
          output: {},
          type: RecipeOutputType.Response,
        }
      );
    },
    updateOutput: (sessionId, output) => {
      set((prevState) => {
        const outputManager = {
          ...prevState.outputManager,
          [sessionId]: output,
        };

        return {
          outputManager,
        };
      });
    },
    clearOutput: (sessionId) => {
      set((prevState) => {
        const outputManager = {
          ...prevState.outputManager,
        };

        delete outputManager[sessionId];

        return {
          outputManager,
        };
      });
    },

    outputTab: RecipeOutputTab.Docs,
    setOutputTab: (tab) => set(() => ({ outputTab: tab })),
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
  ...createDeepActionSlice(...a),
}));

export const GLOBAL_POLLING_FACTOR = 10000;
export const SESSION_HYDRATION_KEY = "SESSION_HYDRATION_KEY";
const RECIPE_BODY_PARAMS_KEY_PREFIX = "RECIPE_BODY_PARAMS_";
const RECIPE_QUERY_PARAMS_KEY_PREFIX = "RECIPE_QUERY_PARAMS_";
const RECIPE_URL_PARAMS_KEY_PREFIX = "RECIPE_URL_PARAMS_";

function getRecipeBodyParamsKey(recipeId: string) {
  return RECIPE_BODY_PARAMS_KEY_PREFIX + recipeId;
}

function getRecipeQueryParamsKey(recipeId: string) {
  return RECIPE_QUERY_PARAMS_KEY_PREFIX + recipeId;
}

function getRecipeUrlParamsKey(recipeId: string) {
  return RECIPE_URL_PARAMS_KEY_PREFIX + recipeId;
}

// We only need to save the session when we change tabs
function preserveSessionParamsToLocal({
  sessionId,
  params: { requestBody, queryParams, urlParams },
}: {
  sessionId: string;
  params: RecipeParameters;
}) {
  localStorage.setItem(
    getRecipeBodyParamsKey(sessionId),
    JSON.stringify(requestBody)
  );
  localStorage.setItem(
    getRecipeQueryParamsKey(sessionId),
    JSON.stringify(queryParams)
  );
  localStorage.setItem(
    getRecipeUrlParamsKey(sessionId),
    JSON.stringify(urlParams)
  );
}

function retrieveParamsForSessionIdFromLocal(
  sessionId: string
): RecipeParameters {
  return {
    requestBody: JSON.parse(
      localStorage.getItem(getRecipeBodyParamsKey(sessionId)) || "{}"
    ),
    queryParams: JSON.parse(
      localStorage.getItem(getRecipeQueryParamsKey(sessionId)) || "{}"
    ),
    urlParams: JSON.parse(
      localStorage.getItem(getRecipeUrlParamsKey(sessionId)) || "{}"
    ),
  };
}

function deleteParamsForSessionIdFromLocal(sessionId: string) {
  localStorage.removeItem(getRecipeBodyParamsKey(sessionId));
  localStorage.removeItem(getRecipeQueryParamsKey(sessionId));
  localStorage.removeItem(getRecipeUrlParamsKey(sessionId));
}
