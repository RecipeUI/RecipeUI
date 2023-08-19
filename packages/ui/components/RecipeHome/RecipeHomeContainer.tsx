"use client";

import {
  RecipeContext,
  RecipeNativeFetch,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeBody } from "../RecipeBody";
import { RecipeBodySearch } from "../RecipeBody/RecipeBodySearch";
import { RecipeHome } from "./RecipeHome";
import classNames from "classnames";

import { Recipe, RecipeProject, UserTemplatePreview } from "types/database";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getURLParamsForSession } from "../../utils/main";
import { ShareInviteModal, ShareModal } from "../RecipeBody/RecipeTemplates";
import { useLocalStorage } from "usehooks-ts";
import { UNIQUE_ELEMENT_IDS } from "../../utils/constants/main";
import Link from "next/link";
import { fetchServer } from "../RecipeBody/RecipeBodySearch/fetchServer";
import { RecipeHomeHero } from "./RecipeHomeHero";

export function RecipeHomeContainer({
  globalProjects,
  projects,
  recipe,
  sessionId,
  sharedTemplate,
}: {
  globalProjects: RecipeProject[];
  projects: RecipeProject[];
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

  const [localForked, setLocalForked] = useLocalStorage(
    UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
    ""
  );

  const user = useRecipeSessionStore((state) => state.user);
  useEffect(() => {
    if (user && localForked) {
      if (localForked === sharedTemplate?.alias) {
        location.reload();
      } else {
        router.push(`/r/${localForked}`);
      }

      setLocalForked("");
    }
  }, [localForked, router, setLocalForked, user]);

  const hasSession = Boolean(recipe && currentSession);

  return (
    <div
      className={classNames(
        "flex-1 flex flex-col",
        currentSession == null && "p-4 sm:px-16 sm:pb-6 sm:pt-8"
      )}
    >
      <RecipeContext.Provider value={recipe || null}>
        <RecipeNativeFetch.Provider value={fetchServer}>
          {!hasSession && <RecipeHomeHero />}
          <RecipeBodySearch />
          {hasSession ? (
            <RecipeBody />
          ) : (
            <>
              <RecipeHome globalProjects={globalProjects} projects={projects} />
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
        </RecipeNativeFetch.Provider>
      </RecipeContext.Provider>
    </div>
  );
}
