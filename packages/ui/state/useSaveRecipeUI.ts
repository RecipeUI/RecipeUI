import { useEffect } from "react";
import { useInterval, useLocalStorage } from "usehooks-ts";
import {
  LocalStorageState,
  SESSION_HYDRATION_KEY,
  getEmptyParameters,
  useRecipeSessionStore,
  GLOBAL_POLLING_FACTOR,
} from "./recipeSession";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database, Recipe } from "types/database";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "../../ui/hooks";

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

  const supabase = createClientComponentClient<Database>();
  const setUserSession = useRecipeSessionStore((state) => state.setUserSession);

  const setOnboarding = useRecipeSessionStore((state) => state.setOnboarding);
  const setUser = useRecipeSessionStore((state) => state.setUser);

  useEffect(() => {
    setOnboarding(false);

    console.debug("Initializing");

    supabase.auth.onAuthStateChange((event, session) => {
      console.debug(session, event);
      setUserSession(session);

      if (
        (event === "INITIAL_SESSION" || event === "SIGNED_IN") &&
        session?.user
      ) {
        // See if user just signed up

        supabase
          .from("user")
          .select("*")
          .eq("user_id", session?.user?.id)
          .then((res) => {
            const results = res.data || [];

            const userInfo = results[0];

            console.debug(
              "User info just onboarded. Trying to figure out this bug",
              userInfo,
              res
            );
            if (!userInfo) {
              setOnboarding(true);
            } else {
              setUser(userInfo);
            }
          });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });
  }, []);

  const initializeRecipes = useRecipeSessionStore(
    (state) => state.initializeRecipes
  );
  useEffect(() => {
    async function fetchRecipes() {
      const res = await supabase.from("recipe_view").select("*");
      const newRecipes = res.data as unknown[] as Recipe[];
      if (res.data) {
        initializeRecipes(newRecipes);
      }

      if (!localSave || isMobile) return null;
      // Lets fix all the sessions and the current session
      // This is not really ideal right now, we should really be referencing ids and then matching later

      let _sessions = localSave.sessions.map((session) => {
        const latestRecipe = newRecipes.find(
          (_recipe) => _recipe.id === session.recipeId
        );

        if (latestRecipe) {
          return {
            ...session,
            recipe: latestRecipe,
          };
        }

        return session;
      });
      setSessions(_sessions);

      if (projectId || shareTemplateIdParam || username) return;

      // const localSession = localSave.currentSession;
      // if (localSession != null) {
      //   const latestRecipe = newRecipes.find(
      //     (_recipe) => _recipe.id === localSession.recipeId
      //   );

      //   if (localSave.currentSession && latestRecipe) {
      //     setCurrentSession({
      //       ...localSession,
      //       recipeId: latestRecipe.id,
      //       recipeMethod: latestRecipe.method,
      //     });
      //   }
      // }
    }
    fetchRecipes();
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
