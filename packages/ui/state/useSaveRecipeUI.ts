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

  // const isTauri = useIsTauri();
  // // Save changes every POLLING_FACTOR seconds
  // useInterval(
  //   () => {
  //     setLocalSave({
  //       requestBody,
  //       queryParams,
  //       urlParams,
  //     });
  //   },
  //   isTauri ? GLOBAL_POLLING_FACTOR * 3 : GLOBAL_POLLING_FACTOR
  // );
}
