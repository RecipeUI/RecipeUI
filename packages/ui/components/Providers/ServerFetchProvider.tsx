"use client";

import { fetchServer } from "../RecipeBody/RecipeBodySearch/fetchServer";
import { RecipeNativeFetchContext } from "../../state/recipeSession";

export function ServerFetchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  fetchServer;
  return (
    <RecipeNativeFetchContext.Provider value={fetchServer}>
      {children}
    </RecipeNativeFetchContext.Provider>
  );
}
