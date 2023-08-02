import { StateCreator, create } from "zustand";
import _recipes from "../assets/recipes.json";
import { Recipe } from "../types/recipes";
import { produce } from "immer";
import { getArrayPathIndex, isArrayPath } from "../utils/main";
import { v4 as uuidv4 } from "uuid";
import { useEffect } from "react";
import { useInterval, useLocalStorage } from "usehooks-ts";

const recipes = [...(_recipes as Recipe[])];

interface RecipeSession {
  id: string;
  name: string;
  recipe: Recipe;
}

interface RecipeSessionSlice {
  currentSession: RecipeSession | null;
  sessions: RecipeSession[];

  setSessions: (sessions: RecipeSession[]) => void;
  setCurrentSession: (session: RecipeSession | null) => void;

  addSession: (selectedRecipe: Recipe) => void;
  closeSession: (session: RecipeSession) => void;
}

export enum RecipeBodyRoute {
  Parameters = "Parameters",
  Examples = "Examples",
  Config = "Config",
}

interface RecipeBodySlice {
  bodyRoute: RecipeBodyRoute;
  setBodyRoute: (route: RecipeBodyRoute) => void;
  recipes: Recipe[];

  requestBody: Record<string, unknown>;
  setRequestBody: (requestBody: Record<string, unknown>) => void;
  updateRequestBody: (updateProps: { path: string; value: unknown }) => void;
}

export interface LocalStorageState {
  sessions: RecipeSession[];
  currentSession: RecipeSessionSlice["currentSession"];
  requestBody: Record<string, unknown>;
}

const createRecipeSessionSlice: StateCreator<
  RecipeBodySlice & RecipeSessionSlice,
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

const createRecipeBodySlice: StateCreator<
  RecipeBodySlice & RecipeSessionSlice,
  [],
  [],
  RecipeBodySlice
> = (set) => {
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

export const useRecipeSessionStore = create<
  RecipeSessionSlice & RecipeBodySlice
>()((...a) => ({
  ...createRecipeSessionSlice(...a),
  ...createRecipeBodySlice(...a),
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
