import { useRecipeSessionStore } from "./recipeSession";

import Cookie from "js-cookie";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { APP_COOKIE } from "../utils/constants/main";
import { useSupabaseClient } from "../components/Providers/SupabaseProvider";
import { shallow } from "zustand/shallow";
import { useDebounce } from "usehooks-ts";

export function useSaveRecipeUI() {
  const supabase = useSupabaseClient();
  const setUserSession = useRecipeSessionStore((state) => state.setUserSession);

  const setOnboarding = useRecipeSessionStore((state) => state.setOnboarding);
  const setUser = useRecipeSessionStore((state) => state.setUser);

  const router = useRouter();

  useEffect(() => {
    setOnboarding(false);

    console.debug("Initializing");

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

  const debouncedStateChanges = useDebounce(newState, 5000);
  const saveSession = useRecipeSessionStore((state) => state.saveEditorSession);
  useEffect(() => {
    saveSession();
    console.debug("Saving changes");
  }, [debouncedStateChanges]);
}
