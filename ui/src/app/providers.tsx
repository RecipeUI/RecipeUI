"use client";
import { useSaveRecipeUI } from "@/state/useSaveRecipeUI";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  useSaveRecipeUI();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
