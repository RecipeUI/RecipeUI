import { useEffect } from "react";
import { useInterval, useLocalStorage } from "usehooks-ts";
import {
  LocalStorageState,
  SESSION_HYDRATION_KEY,
  getEmptyParameters,
  useRecipeSessionStore,
  GLOBAL_POLLING_FACTOR,
} from "./recipeSession";

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
      ...getEmptyParameters(),
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
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const urlParams = useRecipeSessionStore((state) => state.urlParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);

  // On mount, hydrate from local storage
  useEffect(() => {
    console.log("Hydrating from local storage");

    if (!localSave) return;
    if (localSave.currentSession) setCurrentSession(localSave.currentSession);
    if (localSave.sessions) setSessions(localSave.sessions);
    if (localSave.requestBody) setRequestBody(localSave.requestBody);
    if (localSave.queryParams) setQueryParams(localSave.queryParams);
    if (localSave.urlParams) setUrlParams(localSave.urlParams);
  }, []);

  // Save changes every POLLING_FACTOR seconds
  useInterval(() => {
    setLocalSave({
      currentSession,
      sessions,
      requestBody,
      queryParams,
      urlParams,
    });
  }, GLOBAL_POLLING_FACTOR);
}
