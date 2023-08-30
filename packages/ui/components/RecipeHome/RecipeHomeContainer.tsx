"use client";

import {
  RecipeContext,
  RecipeNativeFetchContext,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeHome } from "./RecipeHome";
import classNames from "classnames";

import { Recipe, RecipeProject, UserTemplatePreview } from "types/database";
import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";
import { UNIQUE_ELEMENT_IDS } from "../../utils/constants/main";
import Link from "next/link";
import { fetchServer } from "../RecipeBody/RecipeBodySearch/fetchServer";
import { RecipeHomeHero } from "./RecipeHomeHero";
import { ShareInviteModal } from "../RecipeBody/RecipeLeftPane/RecipeTemplates";

export function RecipeHomeContainer({
  globalProjects,
  projects,
  recipe,
  sharedTemplate,
}: {
  globalProjects: RecipeProject[];
  projects: RecipeProject[];
  recipe?: Recipe;
  sharedTemplate?: UserTemplatePreview;
}) {
  const router = useRouter();

  const [showShareModal, setShowShareModal] = useState(sharedTemplate != null);

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

  const project = useMemo(() => {
    let searchRecipe = recipe ?? sharedTemplate?.recipe;

    return searchRecipe
      ? projects.find((p) => p.project === searchRecipe?.project) ||
          globalProjects.find((p) => p.project === searchRecipe?.project)
      : null;
  }, [globalProjects, projects, recipe, sharedTemplate?.recipe]);

  return (
    <div className={classNames("flex-1 flex flex-col p-8")}>
      <RecipeContext.Provider value={recipe || null}>
        <RecipeProjectContext.Provider value={project || null}>
          <RecipeNativeFetchContext.Provider value={fetchServer}>
            <RecipeHomeHero />
            <RecipeHome globalProjects={globalProjects} projects={projects} />
            {showShareModal && sharedTemplate && (
              <ShareInviteModal
                template={sharedTemplate}
                onClose={() => {
                  setShowShareModal(false);
                }}
              />
            )}
          </RecipeNativeFetchContext.Provider>
        </RecipeProjectContext.Provider>
      </RecipeContext.Provider>
    </div>
  );
}
