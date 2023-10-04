"use client";

import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { useMemo } from "react";
import { useDebounce } from "usehooks-ts";
import { EditorParamView } from "./CodeEditors/common";
import {
  EditorViewWithSchema,
  InitializeSchema,
} from "./CodeEditors/EditorJSON";
import { EditorTypeScript } from "./CodeEditors/EditorTypeScript";
import { EditorQueryOnboarding } from "./EditorOnboarding/EditorQueryOnboarding";
import { API_TYPE_NAMES } from "../../utils/constants/recipe";
import { parse } from "json5";
import { useNeedsOnboarding } from "../../state/apiSession/OnboardingAPI";
import { ONBOARDING_CONSTANTS } from "utils/constants";

export const EditorQuery = () => {
  const editorQuery = useRecipeSessionStore((state) => state.editorQuery);
  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);
  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);
  const editorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.editorQuerySchemaJSON
  );

  const isEmpty = !editorQuery;

  const newQueryChanges = useDebounce(editorQuery, 500);
  const urlQueryParams = useMemo(() => {
    if (!newQueryChanges) return "Enter query params as key value pairs below";

    try {
      const params = parse(newQueryChanges) as Record<string, string>;

      return `?${new URLSearchParams(params).toString()}`;
    } catch (e) {
      return "Invalid query params";
    }
  }, [editorUrl, newQueryChanges]);

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const setSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaJSON
  );
  const setSchemaType = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaType
  );
  const schemaType = useRecipeSessionStore(
    (state) => state.editorQuerySchemaType
  );

  const { needsOnboarding } = useNeedsOnboarding(
    ONBOARDING_CONSTANTS.QUERY_ONBOARDING
  );

  const showJSONEditor = Boolean(editorQuerySchemaJSON || editorQuery);

  return (
    <>
      <div className="grid grid-rows-[auto,1fr,1fr] flex-1 h-full z-20 overflow-x-auto">
        <div className="p-2 px-8 text-sm border-b border-recipe-slate overflow-x-auto h-fit">
          {isEmpty ? (
            "Enter query params as a key value object below"
          ) : (
            <>
              <span className="w-fit break-all">{editorUrl}</span>
              <span className="mt-2 bg-accent py-1 rounded-md text-white w-fit break-all">
                {urlQueryParams}
              </span>
            </>
          )}
        </div>
        {showJSONEditor ? (
          <EditorViewWithSchema
            value={editorQuery}
            setValue={setEditorQuery}
            jsonSchema={editorQuerySchemaJSON}
            key={`${currentSession?.id || "default"}-json-query`}
            typeName={API_TYPE_NAMES.APIQueryParams}
          />
        ) : (
          <InitializeSchema type={EditorParamView.Query} />
        )}
        <EditorTypeScript
          key={`${currentSession?.id || "default"}-types-query`}
          setSchemaJSON={setSchemaJSON}
          setSchemaType={setSchemaType}
          editorParamView={EditorParamView.Query}
          schemaType={schemaType}
          defaultExport={API_TYPE_NAMES.APIQueryParams}
        />
      </div>
      {showJSONEditor && needsOnboarding && process.env.NEXT_PUBLIC_ENV && (
        <EditorQueryOnboarding />
      )}
    </>
  );
};
