"use client";

import { useSaveRecipeUI } from "../state/recipeSession";
import { RecipeBodyContainer } from "./RecipeBody/RecipeBodyContainer";
import { RecipeSidebar } from "./RecipeSidebar";

export function RecipeContainer() {
  useSaveRecipeUI();

  return (
    <div className="flex flex-1 border-t">
      <RecipeSidebar />
      <RecipeBodyContainer />
    </div>
  );
}
