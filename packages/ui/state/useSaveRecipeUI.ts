import { useRecipeSessionStore } from "./recipeSession";

import Cookie from "js-cookie";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { APP_COOKIE, REDIRECT_PAGE } from "../utils/constants/main";
import { useSupabaseClient } from "../components/Providers/SupabaseProvider";
import { shallow } from "zustand/shallow";
import { useDebounce, useSessionStorage } from "usehooks-ts";
import { useIsTauri } from "../hooks/useIsTauri";
import { usePostHog } from "posthog-js/react";
import { v4 as uuidv4 } from "uuid";

export function useSaveRecipeUI() {
  const supabase = useSupabaseClient();
  const setUserSession = useRecipeSessionStore((state) => state.setUserSession);

  const setOnboarding = useRecipeSessionStore((state) => state.setOnboarding);
  const setUser = useRecipeSessionStore((state) => state.setUser);

  const router = useRouter();

  const isTauri = useIsTauri();
  const posthog = usePostHog();

  const [redirect, setRedirect] = useSessionStorage(REDIRECT_PAGE, null);
  useEffect(() => {
    setOnboarding(false);

    console.debug("Initializing");

    supabase.auth.onAuthStateChange((event, session) => {
      console.debug(session, event);
      setUserSession(session);
      setOnboarding(false);

      // posthog.identify(uuidv4(), {
      //   platform:
      //     typeof window !== undefined && "__TAURI__" in window
      //       ? "desktop"
      //       : "web",
      // });
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

              if (!isTauri) {
                router.refresh();

                if (redirect) {
                  const hold = redirect;
                  setRedirect(null);
                  location.href = hold;
                }
              }
            }
          });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      } else {
        // Is there a way to detect the same user without user_id?
      }
    });
  }, []);

  const newState = useRecipeSessionStore(
    (state) => ({
      editorBody: state.editorBody,
      editorQuery: state.editorQuery,
      editorHeaders: state.editorHeaders,

      editorUrl: state.editorUrl,
      editorMethod: state.editorMethod,
      editorBodyType: state.editorBodyType,
      editorBodySchemaType: state.editorBodySchemaType,
      editorBodySchemaJSON: state.editorBodySchemaJSON,
      editorQuerySchemaType: state.editorQuerySchemaType,
      editorQuerySchemaJSON: state.editorQuerySchemaJSON,
    }),
    shallow
  );

  const debouncedStateChanges = useDebounce(newState, 2000);
  const saveSession = useRecipeSessionStore((state) => state.saveEditorSession);
  useEffect(() => {
    saveSession();
    console.debug("Saving changes");
  }, [debouncedStateChanges]);
}
