"use client";

import classNames from "classnames";
import { RouteTypeLabel } from "../../RouteTypeLabel";
import {
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeSearchButton } from "./RecipeSearchButton";
import { useContext } from "react";
import { RecipeMethod } from "types/enums";

export function RecipeEditBodySearch() {
  const selectedRecipe = useContext(RecipeContext)!;

  const url = useRecipeSessionStore((state) => state.editorUrl);
  const setUrl = useRecipeSessionStore((state) => state.setEditorUrl);

  const method = useRecipeSessionStore((state) => state.editorMethod);
  const setMethod = useRecipeSessionStore((state) => state.setEditorMethod);

  return (
    <div className={classNames("p-4 z-0")}>
      <div className={classNames("flex flex-col relative")}>
        <div className="flex space-x-2 sm:flex sm:space-x-2 sm:flex-row">
          <div
            className={classNames(
              "input input-bordered flex-1 flex items-center space-x-2 py-4 sm:mb-0 border-slate-200 dark:border-slate-600"
            )}
          >
            <select
              className="select select-sm"
              onChange={(e) => {
                setMethod(e.target.value as RecipeMethod);
              }}
              value={method}
            >
              <option value={RecipeMethod.GET}>{RecipeMethod.GET}</option>
              <option value={RecipeMethod.POST}>{RecipeMethod.POST}</option>
              <option value={RecipeMethod.PUT}>{RecipeMethod.PUT}</option>
              <option value={RecipeMethod.DELETE}>{RecipeMethod.DELETE}</option>
            </select>

            <input
              placeholder="Enter URL here"
              className={classNames("outline-none w-full dark:bg-transparent")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-flow-col gap-x-2">
            <RecipeSearchButton />
            {/* <RecipePublishButton /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
