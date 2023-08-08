"use client";
import { useSaveRecipeUI } from "@/state/useSaveRecipeUI";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useRef } from "react";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useParams, usePathname, useSearchParams } from "next/navigation";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ENV === "prod") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: window.origin + "/ingest",
    autocapture: false,
    capture_pageleave: false,
    capture_pageview: false,
  });
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

  useEffect(() => {
    console.log("Initial load");
  }, []);

  return <></>;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  useSaveRecipeUI();

  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PostHogProvider>
  );
}
