"use client";

import {
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeBody } from "../RecipeBody";
import { RecipeBodySearch } from "../RecipeBody/RecipeBodySearch";
import { RecipeHome } from "./RecipeHome";
import classNames from "classnames";
import {
  Recipe,
  RecipeProject,
  UserTemplatePreview,
} from "@/types/databaseExtended";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getURLParamsForSession } from "@/utils/main";
import {
  ShareInviteModal,
  ShareModal,
} from "@/components/RecipeBody/RecipeTemplates";
import { useLocalStorage } from "usehooks-ts";
import { UNIQUE_ELEMENT_IDS } from "@/utils/constants";

export function RecipeHomeContainer({
  recipeProjects,
  recipe,
  sessionId,
  sharedTemplate,
}: {
  recipeProjects: RecipeProject[];
  recipe?: Recipe;
  sessionId?: string;
  sharedTemplate?: UserTemplatePreview;
}) {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const addSession = useRecipeSessionStore((state) => state.addSession);
  const router = useRouter();

  const [showShareModal, setShowShareModal] = useState(sharedTemplate != null);
  const currentSession = useMemo(() => {
    return sessions.find((session) => session.id === sessionId);
  }, [sessions, sessionId]);

  useEffect(() => {
    // Lets make it so that the recipe is always correct. If there is no session active, we will create a new one.
    if (currentSession && recipe && currentSession.recipeId != recipe.id) {
      const newSession = addSession(recipe);
      router.push(`/?${getURLParamsForSession(newSession)}`);
    }
  }, [addSession, currentSession, recipe, router]);

  const [forkedTemplate, setForkedTemplate] = useLocalStorage<null | string>(
    UNIQUE_ELEMENT_IDS.FORK_HOOK_REGISTER,
    null
  );

  useEffect(() => {
    if (forkedTemplate) {
      setForkedTemplate(null);
      router.push(`/r/${forkedTemplate}`);
    }
  }, []);

  return (
    <div
      className={classNames(
        "flex-1 flex flex-col",
        currentSession == null && "p-4 sm:px-6 sm:pb-6 sm:pt-4"
      )}
    >
      <RecipeContext.Provider value={recipe || null}>
        <RecipeBodySearch />
        {recipe && currentSession ? (
          <RecipeBody />
        ) : (
          <>
            <RecipeHome projects={recipeProjects} />
            {showShareModal && sharedTemplate && (
              <ShareInviteModal
                template={sharedTemplate}
                onClose={() => {
                  setShowShareModal(false);
                }}
              />
            )}
          </>
        )}
      </RecipeContext.Provider>
    </div>
  );
}
