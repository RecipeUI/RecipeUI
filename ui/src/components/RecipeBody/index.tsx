"use client";
import classNames from "classnames";
import { RecipeParameterTab } from "./RecipeParameterTab";
import { RecipeTemplatesTab } from "./RecipeTemplates";
import { RecipeConfigTab } from "./RecipeConfigTab";
import { useMemo } from "react";
import { RecipeOutput } from "../RecipeOutput";
import { RecipeBodyRoute, useRecipeSessionStore } from "@/state/recipeSession";

export function RecipeBody() {
  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe
  );
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const routes = useMemo(() => {
    if (selectedRecipe === null) {
      return [];
    }

    const parameters = [RecipeBodyRoute.Parameters];

    if (
      selectedRecipe &&
      "examples" in selectedRecipe &&
      selectedRecipe.examples &&
      selectedRecipe.examples?.length > 0
    ) {
      parameters.push(RecipeBodyRoute.Templates);
    }

    if (selectedRecipe.auth !== null) {
      parameters.push(RecipeBodyRoute.Config);
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
      <div className="flex-1 border-t sm:grid sm:grid-cols-2 flex flex-col">
        {bodyRoute === RecipeBodyRoute.Parameters && <RecipeParameterTab />}
        {bodyRoute === RecipeBodyRoute.Templates && <RecipeTemplatesTab />}
        {bodyRoute === RecipeBodyRoute.Config && <RecipeConfigTab />}
        <RecipeOutput />
      </div>
    </>
  );
}
