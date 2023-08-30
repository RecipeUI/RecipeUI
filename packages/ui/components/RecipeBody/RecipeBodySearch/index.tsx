"use client";

import classNames from "classnames";
import { useContext } from "react";
import { RouteTypeLabel } from "../../RouteTypeLabel";

import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeSearchButton } from "./RecipeSearchButton";
import { RecipeSaveButton } from "../../RecipeBody/RecipeBodySearch/RecipeSaveButton";
import { useLoadingTemplate } from "../../RecipeBody/RecipeBodySearch/useLoadingTemplate";

export function RecipeBodySearch() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);

  const selectedRecipe = useContext(RecipeContext);

  useLoadingTemplate();

  return (
    <div
      className={classNames(
        "p-4 py-2 sm:py-4",
        (bodyRoute === RecipeBodyRoute.Templates || loadingTemplate) && ""
      )}
    >
      <div
        className={classNames(
          "flex flex-col relative",
          (currentSession == null ||
            bodyRoute === RecipeBodyRoute.Templates ||
            loadingTemplate) &&
            "hidden sm:block"
        )}
      >
        <div className="flex space-x-2 sm:flex sm:space-x-2 sm:flex-row">
          <div
            className={classNames(
              "input input-bordered flex-1 flex items-center space-x-2 py-4 sm:mb-0 border-slate-200 dark:border-slate-600"
            )}
          >
            {selectedRecipe?.method && (
              <RouteTypeLabel recipeMethod={selectedRecipe.method} />
            )}
            <input
              className={classNames("outline-none w-full dark:bg-transparent")}
              {...(currentSession && {
                value: selectedRecipe?.path,
                onChange: () => {},
              })}
            />
          </div>
          {currentSession != null && selectedRecipe != null && (
            <div className="grid grid-flow-col gap-x-2">
              <RecipeSearchButton />
              {/* <RecipeSaveButton /> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
