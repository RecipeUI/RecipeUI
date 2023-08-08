"use client";

import {
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeBody } from "../RecipeBody";
import { RecipeBodySearch } from "../RecipeBody/RecipeBodySearch";
import { RecipeHome } from "./RecipeHome";
import classNames from "classnames";
import { Recipe, RecipeProject } from "@/types/databaseExtended";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getURLParamsForSession } from "@/utils/main";

export function RecipeHomeContainer({
  recipeProjects,
  recipe,
  sessionId,
}: {
  recipeProjects: RecipeProject[];
  recipe?: Recipe;
  sessionId?: string;
}) {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const addSession = useRecipeSessionStore((state) => state.addSession);
  const router = useRouter();

  const currentSession = useMemo(() => {
    return sessions.find((session) => session.id === sessionId);
  }, [sessions, sessionId]);

  console.log(sessions, currentSession, sessionId);
  useEffect(() => {
    // Lets make it so that the recipe is always correct. If there is no session active, we will create a new one.
    if (currentSession && recipe && currentSession.recipeId != recipe.id) {
      const newSession = addSession(recipe);
      router.push(`/?${getURLParamsForSession(newSession)}`);
    }
  }, [addSession, currentSession, recipe, router]);

  return (
    <div
      className={classNames(
        "flex-1 flex flex-col",
        currentSession === null && "px-6 pb-6 pt-4"
      )}
    >
      <RecipeContext.Provider value={recipe || null}>
        <RecipeBodySearch />
        {recipe && currentSession ? (
          <RecipeBody />
        ) : (
          <RecipeHome projects={recipeProjects} />
        )}
      </RecipeContext.Provider>
    </div>
  );
}
