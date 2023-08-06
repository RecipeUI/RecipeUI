"use client";

import { useSaveRecipeUI } from "@/state/useSaveRecipeUI";
import { RecipeBodyContainer } from "./RecipeBody/RecipeBodyContainer";
import { RecipeSidebar } from "./RecipeSidebar";

export function RecipeContainer() {
  return (
    <div className="flex flex-1 border-t">
      <RecipeSidebar />
      <RecipeBodyContainer />
    </div>
  );
}
