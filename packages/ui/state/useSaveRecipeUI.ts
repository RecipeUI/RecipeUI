import { Database, Recipe } from "types/database";

import {
  GLOBAL_POLLING_FACTOR,
  LocalStorageState,
  SESSION_HYDRATION_KEY,
  getEmptyParameters,
  useRecipeSessionStore,
} from "./recipeSession";

import Cookie from "js-cookie";

import { useInterval, useLocalStorage } from "usehooks-ts";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useIsMobile } from "../../ui/hooks";
import { APP_COOKIE } from "../utils/constants/main";
import { useIsTauri } from "../hooks/useIsTauri";
import { useSupabaseClient } from "../components/Providers/SupabaseProvider";

/*
This is definitely a naive, unoptimized, approach to storing data locally.

Basically, save everything relevant to use every GLOBAL_POLLING_FACTOR seconds.
*/

export function useSaveRecipeUI() {
  const { username } = useParams();
  const { project: projectId, recipe: shareTemplateIdParam } = useParams();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

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
  const isMobile = useIsMobile();
  // On mount, hydrate from local storage

  useEffect(() => {
    console.log("Hydrating from local storage");

    if (!localSave || isMobile) return;

    // if (
    //   localSave.currentSession &&
    //   !projectId &&
    //   !shareTemplateIdParam &&
    //   !username
    // ) {
    //   router.push(`/?${getURLParamsForSession(localSave.currentSession)}`);
    //   setCurrentSession(localSave.currentSession);
    // }
    if (localSave.sessions) setSessions(localSave.sessions);
    if (localSave.requestBody) setRequestBody(localSave.requestBody);
    if (localSave.queryParams) setQueryParams(localSave.queryParams);
    if (localSave.urlParams) setUrlParams(localSave.urlParams);
  }, []);

  const supabase = useSupabaseClient();
  const setUserSession = useRecipeSessionStore((state) => state.setUserSession);

  const setOnboarding = useRecipeSessionStore((state) => state.setOnboarding);
  const setUser = useRecipeSessionStore((state) => state.setUser);

  useEffect(() => {
    setOnboarding(false);

    console.debug("Initializinag");

    supabase.auth.onAuthStateChange((event, session) => {
      console.debug(session, event);
      setUserSession(session);
      setOnboarding(false);

      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        session?.user
      ) {
        supabase
          .from("user")
          .select("*")
          .eq("user_id", session?.user?.id)
          .then((res) => {
            const results = res.data || [];
            const userInfo = results[0];

            if (!userInfo) {
              console.debug(
                "User info just onboarded. Trying to figure out this bug",
                userInfo,
                res
              );

              setOnboarding(true);
            } else {
              Cookie.set(APP_COOKIE, "true", { expires: 7 });

              setUser(userInfo);
              router.refresh();
            }
          });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (projectId || shareTemplateIdParam || username) return;

    if ((sessionIdParam as string) && localSave?.sessions) {
      const session = localSave.sessions.find((s) => s.id === sessionIdParam);

      if (!session) {
        console.debug(
          "URL has a session that no longer exists",
          sessionIdParam
        );
        router.push("/");
        return;
      }

      setCurrentSession(session);
    } else if (!sessionIdParam && currentSession) {
      console.debug("URL has no session, but locally we should");
      setCurrentSession(null);
      router.push("/");
    }
  }, []);

  const isTauri = useIsTauri();
  // Save changes every POLLING_FACTOR seconds
  useInterval(
    () => {
      setLocalSave({
        currentSession,
        sessions,
        requestBody,
        queryParams,
        urlParams,
      });
    },
    isTauri ? GLOBAL_POLLING_FACTOR * 3 : GLOBAL_POLLING_FACTOR
  );
}
