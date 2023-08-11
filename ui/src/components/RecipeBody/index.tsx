"use client";
import classNames from "classnames";
import { RecipeParameterTab } from "./RecipeParameterTab";
import { RecipeTemplatesTab } from "./RecipeTemplates";
import { RecipeConfigTab } from "./RecipeConfigTab";
import { useContext, useMemo } from "react";
import { RecipeOutput } from "../RecipeOutput";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "@/state/recipeSession";
import { useLocalStorage, useScreen } from "usehooks-ts";
import { UNIQUE_ELEMENT_IDS } from "@/utils/constants";
import { UserTemplatePreview } from "@/types/databaseExtended";

export function RecipeBody() {
  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);

  // We should probably actually fetch the id here if possible?
  const selectedRecipe = useContext(RecipeContext);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const screen = useScreen();
  const [forkedTemplate, setForkedTemplate] =
    useLocalStorage<UserTemplatePreview | null>(
      UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
      null
    );
  const routes = useMemo(() => {
    if (selectedRecipe === null) {
      return [];
    }

    const parameters = [RecipeBodyRoute.Parameters];

    if (
      (selectedRecipe &&
        selectedRecipe.templates &&
        selectedRecipe.templates.length > 0) ||
      (selectedRecipe.userTemplates &&
        selectedRecipe.userTemplates.length > 0) ||
      forkedTemplate
    ) {
      parameters.push(RecipeBodyRoute.Templates);
    }

    if (selectedRecipe.auth !== null) {
      parameters.push(RecipeBodyRoute.Config);
    }

    if (
      screen?.width &&
      screen.width < 640 &&
      parameters.includes(RecipeBodyRoute.Templates)
    ) {
      setBodyRoute(RecipeBodyRoute.Templates);
      // Make sure Templates is first on mobile
      parameters.sort((a, b) => {
        if (a === RecipeBodyRoute.Templates) {
          return -1;
        } else if (b === RecipeBodyRoute.Templates) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    return parameters;
  }, [selectedRecipe]);

  if (routes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex space-x-6 p-4 pt-2">
        {routes.map((route) => {
          return (
            <div
              key={route}
              className={classNames(
                "font-bold text-sm",
                bodyRoute === route && "underline underline-offset-4",
                "cursor-pointer"
              )}
              onClick={() => setBodyRoute(route)}
            >
              {route}
            </div>
          );
        })}
      </div>
      <div className="flex-1 border-t sm:grid sm:grid-cols-2 flex flex-col overflow-x-auto">
        {bodyRoute === RecipeBodyRoute.Parameters && <RecipeParameterTab />}
        {bodyRoute === RecipeBodyRoute.Templates && <RecipeTemplatesTab />}
        {bodyRoute === RecipeBodyRoute.Config && <RecipeConfigTab />}
        <RecipeOutput />
      </div>
    </>
  );
}
