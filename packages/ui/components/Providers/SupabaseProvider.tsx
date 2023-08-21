import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext } from "react";
import { Database } from "types/database";

export const SupabaseContext = createContext<SupabaseClient<Database>>(
  {} as SupabaseClient
);

export function useSupabaseClient() {
  return useContext(SupabaseContext);
}

export type RecipeSupabase = SupabaseClient<Database>;
