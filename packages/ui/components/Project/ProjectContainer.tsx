"use client";

import { ProjectHome } from "./ProjectHome";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { Recipe, RecipeProject } from "types/database";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsTauri } from "../../hooks/useIsTauri";
import { useCoreProject } from "../../state/apiSession/RecipeUICollectionsAPI";

export function ProjectContainer({
  projectName,
  project: _project,
  recipes: _recipes,
}: {
  projectName: string;
  project: RecipeProject | null;
  recipes: Recipe[] | null;
}) {
  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  const { loading, projectInfo } = useCoreProject({
    projectName: projectName,
  });

  const project = _project || projectInfo?.project;
  const hasNoProject = project == null;
  const recipes =
    _recipes && _recipes.length > 0 ? _recipes : projectInfo?.recipes;

  useEffect(() => {
    if (hasNoProject) {
      if (loading) {
        return;
      }

      if (isTauri) {
        setDesktopPage({
          page: DesktopPage.Project,
          pageParam: projectName,
        });
      } else {
        setTimeout(() => router.push("/"), 3000);
      }
    }
  }, [isTauri, loading]);

  return (
    <div
      className={classNames(
        "flex-1 flex flex-col sm:px-6 sm:pb-6 sm:pt-4 w-screen"
      )}
    >
      {hasNoProject ? (
        <div className="flex items-center space-x-4 px-4 pt-4">
          {!loading && (
            <span className="text-xl font-bold">
              No collection {projectName}, redirecting back to home page.
            </span>
          )}
          <span className="loading loading-bars loading-lg"></span>
        </div>
      ) : (
        <ProjectHome project={project} recipes={recipes || []} />
      )}
    </div>
  );
}
