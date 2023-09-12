"use client";

import { ProjectHome } from "./ProjectHome";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { Recipe, RecipeProject } from "types/database";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsTauri } from "../../hooks/useIsTauri";

export function ProjectContainer({
  projectName,
  project,
  recipes,
}: {
  projectName: string;
  project: RecipeProject | null;
  recipes: Recipe[] | null;
}) {
  const router = useRouter();
  const hasNoProject = project === null;
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  // useEffect(() => {
  //   if (hasNoProject) {
  //     if (isTauri) {
  //       setDesktopPage({
  //         page: DesktopPage.Project,
  //         pageParam: projectName,
  //       });
  //     } else {
  //       setTimeout(() => router.push("/"), 3000);
  //     }
  //   }
  // }, [isTauri]);

  return (
    <div className={classNames("flex-1 flex flex-col sm:px-6 sm:pb-6 sm:pt-4")}>
      {hasNoProject ? (
        <div className="flex items-center space-x-4 px-4 pt-4">
          <span className="text-xl font-bold">
            No collection {projectName}, redirecting back to home page.
          </span>
          <span className="loading loading-bars loading-lg"></span>
        </div>
      ) : (
        <ProjectHome project={project} recipes={recipes || []} />
      )}
    </div>
  );
}
