"use client";
import classNames from "classnames";
import { RecipeParameterTab } from "./RecipeParameterTab";
import { RecipeTemplatesTab } from "./RecipeTemplates";
import { RecipeConfigTab } from "./RecipeConfigTab";
import { useContext, useEffect, useMemo } from "react";
import { RecipeOutput } from "../RecipeOutput";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "@/state/recipeSession";
import { useLocalStorage, useScreen } from "usehooks-ts";
import { UNIQUE_ELEMENT_IDS } from "@/utils/constants/main";
import { UserTemplatePreview } from "@/types/databaseExtended";
import { useIsMobile } from "@/utils/main";
import { useRouter } from "next/navigation";

export function RecipeBody() {
  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);

  // We should probably actually fetch the id here if possible?
  const selectedRecipe = useContext(RecipeContext);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const isMobile = useIsMobile();
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

    if (selectedRecipe.auth !== null && !isMobile) {
      parameters.push(RecipeBodyRoute.Config);
    }

    if (isMobile && parameters.includes(RecipeBodyRoute.Templates)) {
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
  }, [forkedTemplate, isMobile, selectedRecipe, setBodyRoute]);

  useEffect(() => {
    if (isMobile) {
      setBodyRoute(RecipeBodyRoute.Templates);
    }
  }, [isMobile, setBodyRoute]);

  const router = useRouter();
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  if (routes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex space-x-6 sm:p-4 sm:pt-2 pl-4 pb-4">
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
        <div
          className={"font-bold text-sm cursor-pointer sm:hidden"}
          onClick={() => {
            setCurrentSession(null);
            router.push("/");
          }}
        >
          {"Home"}
        </div>
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
