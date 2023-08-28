"use client";

import { fetchServer } from "ui/components/RecipeBody/RecipeBodySearch/fetchServer";
import { RecipeNativeFetch } from "ui/state/recipeSession";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RecipeNativeFetch.Provider value={fetchServer}>
      {children}
    </RecipeNativeFetch.Provider>
  );
}
