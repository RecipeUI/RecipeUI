"use client";

import classNames from "classnames";
import { RouteTypeLabel } from "../../RouteTypeLabel";
import {
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeSearchButton } from "./RecipeSearchButton";
import { useContext, useEffect, useState } from "react";
import { RecipeMethod } from "types/enums";
import { RecipeSaveButton } from "./RecipeSaveButton";
import { CurlModal } from "../../../pages/editor/Builders/CurlModal";
import { useDebounce } from "usehooks-ts";

export function RecipeEditBodySearch() {
  const url = useRecipeSessionStore((state) => state.editorUrl);
  const setUrl = useRecipeSessionStore((state) => state.setEditorUrl);

  const method = useRecipeSessionStore((state) => state.editorMethod);
  const setMethod = useRecipeSessionStore((state) => state.setEditorMethod);

  const updateSessionMethod = useRecipeSessionStore(
    (state) => state.updateCurrentSessionMethod
  );

  const [curlString, setCurlString] = useState("");
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <>
      <div className={classNames("p-4 z-0")}>
        <div className={classNames("flex flex-col relative")}>
          <div className="flex space-x-2 sm:flex sm:space-x-2 sm:flex-row">
            <div
              className={classNames(
                "input input-bordered flex-1 flex items-center space-x-2 py-4 sm:mb-0 border-slate-200 dark:border-slate-600"
              )}
            >
              <select
                className={classNames("select select-sm  select-ghost", {
                  "text-green-600": method === RecipeMethod.GET,
                  "text-orange-600":
                    method === RecipeMethod.POST || method === RecipeMethod.PUT,
                  "text-red-600": method === RecipeMethod.DELETE,
                })}
                onChange={(e) => {
                  setMethod(e.target.value as RecipeMethod);
                  updateSessionMethod(e.target.value as RecipeMethod);
                }}
                value={method}
              >
                <option value={RecipeMethod.GET}>{RecipeMethod.GET}</option>
                <option value={RecipeMethod.POST}>{RecipeMethod.POST}</option>
                <option value={RecipeMethod.PUT}>{RecipeMethod.PUT}</option>
                <option value={RecipeMethod.DELETE}>
                  {RecipeMethod.DELETE}
                </option>
              </select>

              <div className="relative flex-1">
                <input
                  onPaste={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const pasteString = e.clipboardData
                      .getData("text/plain")
                      .trim();

                    if (pasteString.toLowerCase().startsWith("curl")) {
                      setCurlString(pasteString);
                    } else {
                      setUrl(pasteString);
                    }
                  }}
                  placeholder="Enter URL here"
                  className={classNames(
                    "outline-none w-full dark:bg-transparent z-10"
                  )}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-flow-col gap-x-2">
              <RecipeSearchButton />
              <RecipeSaveButton />
            </div>
          </div>
        </div>
      </div>
      {curlString && (
        <CurlModal
          curlString={curlString}
          onClose={() => setCurlString("")}
          currentSession={currentSession}
        />
      )}
    </>
  );
}
