"use client";

import { RecipeBody } from "@/components/RecipeBody";
import { useRecipeSessionStore } from "@/state/recipeSession";

export function SessionBody() {
  const session = useRecipeSessionStore((state) => state.currentSession);

  if (!session) {
    return null;
  }

  return <RecipeBody />;
}
