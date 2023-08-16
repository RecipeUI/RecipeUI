"use client";

import { useRecipeSessionStore } from "@/state/recipeSession";
import { Recipe, RecipeProject } from "types/database";
import { RecipeProjectStatus } from "types/enums";
import { getURLParamsForSession } from "@/utils/main";
import classNames from "classnames";
import { useRouter } from "next/navigation";

export function ProjectHome({
  project,
  recipes,
}: {
  project: RecipeProject;
  recipes: Recipe[];
}) {
  return (
    <div className="flex-1 px-4 pt-4">
      <div className="flex justify-start rounded-md border min-h-[250px] bg-white dark:bg-slate-800">
        <div className="p-4 flex flex-col space-y-8 lg:space-y-0   lg:flex-row lg:items-center lg:space-x-8">
          {project.image && (
            <img
              src={project.image}
              className="max-w-[10rem] lg:max-w-xs rounded-lg"
              alt={project.title}
            />
          )}
          <div className="ml-4">
            <h1 className="text-5xl font-bold">{project.title}</h1>
            <p className="py-4">{project.description}</p>
          </div>
        </div>
      </div>
      <div className="projects-home-container">
        {recipes.map((recipe) => {
          return (
            <ProjectHomeBox key={recipe.id} recipe={recipe} project={project} />
          );
        })}
      </div>
    </div>
  );
}

function ProjectHomeBox({
  recipe,
  project,
}: {
  recipe: Recipe;
  project: RecipeProject;
}) {
  const router = useRouter();
  const addSession = useRecipeSessionStore((state) => state.addSession);

  return (
    <div
      className="border border-slate-700 rounded-md p-4 space-y-1 flex flex-col h-38 cursor-pointer recipe-container-box"
      onClick={() => {
        const session = addSession(recipe);
        router.push(`/?${getURLParamsForSession(session)}`);
      }}
    >
      <div className="flex justify-between ">
        <div className="flex items-center">
          <h2 className="font-bold text-lg dark:text-gray-300">
            {recipe.title}
          </h2>
        </div>

        <button
          className={classNames(
            "btn btn-neutral btn-sm",
            project.status === RecipeProjectStatus.Soon && "!btn-accent"
          )}
        >
          View
        </button>
      </div>

      <p className="text-sm text-black line-clamp-3 dark:text-gray-300">
        {recipe.summary}
      </p>
      {recipe.tags && recipe.tags.length > 0 && (
        <>
          <div className="flex-1" />
          <div className="space-x-2">
            {recipe.tags.map((tag) => {
              return (
                <span
                  className="badge badge-info p-2 py-3"
                  key={recipe.id + tag}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
