"use client";

import { fetchServer } from "ui/components/RecipeBody/RecipeBodySearch/fetchServer";
import { RecipeNativeFetchContext } from "ui/state/recipeSession";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RecipeNativeFetchContext.Provider value={fetchServer}>
      {children}
    </RecipeNativeFetchContext.Provider>
  );
}
