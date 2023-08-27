"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import { RecipeEditBodySearch } from "ui/components/RecipeBody/RecipeBodySearch/RecipeEditBodySearch";
import { RecipeSidebar } from "ui/components/RecipeSidebar";
import { RecipeBodyRoute, useRecipeSessionStore } from "ui/state/recipeSession";
import { EditorBody } from "./EditorBody";
import { EditHeaders } from "./EditHeaders";
import { EditorQuery } from "@/app/editor/EditorQuery";
import { RecipeOutput } from "ui/components/RecipeOutput";
import {
  getConfigForSessionStore,
  getParametersForSessionStore,
} from "ui/state/apiSession";
import { Loading } from "ui/components/Loading";

const EDITOR_ROUTES = [
  RecipeBodyRoute.Body,
  RecipeBodyRoute.Query,
  RecipeBodyRoute.Headers,
];

function EditorPage() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div className="flex h-full">
      <RecipeSidebar />
      {currentSession ? <CoreEditor /> : <NewRequest />}
    </div>
  );
}

function NewRequest() {
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  return (
    <div
      className={"flex-1 flex flex-col relative justify-center items-center"}
    >
      <div className="space-y-6 min-w-[600px]">
        <section className="space-y-2 flex flex-col">
          <h1 className="font-bold text-lg">New Request Templates</h1>
          <NewRequestAction
            label="Start from scratch"
            description="No configuration setup."
            onClick={() => {
              addEditorSession();
            }}
          />
          <NewRequestAction
            label="Import from CURL"
            description="Use CURL to prefill request info, TypeScript types, and JSON Schema."
          />
        </section>

        <section className="space-y-2 flex flex-col">
          <h2 className="font-bold text-lg">Fork Popular Examples</h2>
          <NewRequestAction
            label="OpenAI Chat Completion"
            description="Figure out how to do generative AI with OpenAI's API."
          />
          <NewRequestAction
            label="Pokemon API"
            description="Lightweight, fun, and no Auth needed."
          />
        </section>
      </div>
    </div>
  );
}

function NewRequestAction({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="border rounded-md p-4 max-w-[xs] text-start"
      onClick={onClick}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs">{description}</p>
    </button>
  );
}

function CoreEditor() {
  const method = useRecipeSessionStore((state) => state.editorMethod);
  const updateSessionMethod = useRecipeSessionStore(
    (state) => state.updateCurrentSessionMethod
  );

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
