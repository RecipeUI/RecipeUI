"use client";

import classNames from "classnames";
import { useEffect } from "react";
import { RecipeMethod } from "types/enums";
import { RecipeEditBodySearch } from "ui/components/RecipeBody/RecipeBodySearch/RecipeEditBodySearch";
import { RecipeOutput } from "ui/components/RecipeOutput";
import { RecipeBodyRoute, useRecipeSessionStore } from "ui/state/recipeSession";
import { EDITOR_NEW_SESSION_ID } from "ui/utils/constants/main";
import { v4 as uuidv4 } from "uuid";
import { EditorBody } from "./EditorBody";
import { EditHeaders } from "./EditHeaders";
import { EditorQuery } from "@/app/editor/EditorQuery";

const EDITOR_ROUTES = [
  RecipeBodyRoute.Body,
  RecipeBodyRoute.Query,
  RecipeBodyRoute.Headers,
];

function EditorPage() {
  8;
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );
  const method = useRecipeSessionStore((state) => state.editorMethod);
  const updateSessionMethod = useRecipeSessionStore(
    (state) => state.updateCurrentSessionMethod
  );
  const setEditorMode = useRecipeSessionStore((state) => state.setEditorMode);

  useEffect(() => {
    const newId = uuidv4();
    setCurrentSession({
      id: newId,
      name: "New Session",
      recipeId: 1,
      recipeMethod: RecipeMethod.GET,
    });

    setBodyRoute(RecipeBodyRoute.Body);
    setEditorMode(true);
  }, []);

  useEffect(() => {
    updateSessionMethod(method);
  }, [method, updateSessionMethod]);

  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  return (
    <div className={classNames("flex-1 flex flex-col relative")}>
      <RecipeEditBodySearch />

      <div className="flex space-x-6 sm:p-4 sm:pt-2 pl-4 pb-4">
        {EDITOR_ROUTES.map((route) => {
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

      <div className="flex-1 border-t border-t-slate-200 dark:border-t-slate-600  sm:flex-row flex flex-col overflow-auto">
        {bodyRoute === RecipeBodyRoute.Body && <EditorBody />}
        {bodyRoute === RecipeBodyRoute.Query && <EditorQuery />}
        {bodyRoute === RecipeBodyRoute.Headers && <EditHeaders />}
        <RecipeOutput />
      </div>
    </div>
  );
}

export default EditorPage;
