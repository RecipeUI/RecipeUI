"use client";
import { useSaveRecipeUI } from "../../state/useSaveRecipeUI";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { SupabaseContext } from "./SupabaseProvider";
import {
  SupabaseClient,
  createClientComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { RecipeUICoreAPI } from "../../state/apiSession/RecipeUICoreAPI";

// Remember initPosthog has to be run
export function initPosthog() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ENV === "prod") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host:
        "__TAURI__" in window
          ? process.env.NEXT_PUBLIC_POSTHOG_HOST
          : window.origin + "/ingest",
      autocapture: false,
      capture_pageleave: false,
      capture_pageview: false,
    });
  }
}

export function PostHogPageview(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <></>;
}

export function SavingProvider({ children }: { children: ReactNode }) {
  useSaveRecipeUI();
  return <>{children}</>;
}
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    if (typeof window !== undefined && "__TAURI__" in window) {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setSupabase(
          createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
            {
              auth: {
                persistSession: true,
                storageKey: "RecipeUI",
                storage: window.localStorage,
                flowType: "pkce",
              },
            }
          )
        );
      } else {
        setSupabase({
          auth: {
            onAuthStateChange: () => {},
          },
          fake: true
        } as any);
      }
    } else {
      setSupabase(createClientComponentClient());
    }
  }, []);

  useEffect(() => {
    RecipeUICoreAPI.syncCore();
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        {supabase && (
          <SupabaseContext.Provider value={supabase}>
            <SavingProvider>{children}</SavingProvider>
          </SupabaseContext.Provider>
        )}
      </QueryClientProvider>
    </PostHogProvider>
  );
}
