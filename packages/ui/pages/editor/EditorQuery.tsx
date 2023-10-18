"use client";

import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { useCallback, useEffect, useMemo } from "react";
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
import classNames from "classnames";

export const EditorQuery = () => {
  const editorQuery = useRecipeSessionStore((state) => state.editorQuery);
  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);
  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);
  const editorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.editorQuerySchemaJSON
  );

  const isEmpty = !editorQuery;

  const newQueryChanges = useDebounce(editorQuery, 500);
  const newEditorURLChanges = useDebounce(editorUrl, 500);
  const { error, queryString, missingParams } = useMemo(() => {
    try {
      const params = parse(newQueryChanges || "{}") as Record<string, string>;

      const missingParamsRecord: Record<string, string | null> = {};

      const searchParams = Array.from(
        new URL(newEditorURLChanges).searchParams.entries()
      );
      for (const [key, value] of searchParams) {
        if (params[key] === undefined) {
          missingParamsRecord[key] = value;
        } else {
          missingParamsRecord[key] = null;
        }
      }

      const missingParmKeys = Object.keys(missingParamsRecord).length
        ? missingParamsRecord
        : null;

      if (!newQueryChanges) {
        return {
          error: "Enter query params as key value pairs below",
          missingParams: missingParmKeys,
        };
      }

      return {
        queryString: `?${new URLSearchParams(params).toString()}`,
        queryState: params,
        missingParams: missingParmKeys,
      };
    } catch (e) {
      return { error: "Invalid query params or URL" };
    }
  }, [newEditorURLChanges, newQueryChanges]);

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
  const setEditorUrl = useRecipeSessionStore((state) => state.setEditorUrl);

  useEffect(() => {
    async function initializeDefault() {
      try {
        const newQueryState = {
          ...missingParams,
          ...parse(editorQuery || "{}"),
        } satisfies Record<string, string | null>;

        setEditorQuery(JSON.stringify(newQueryState, null, 2));
        setEditorUrl(editorUrl.split("?")[0]);

        const newTypes = missingParams
          ? Object.keys(missingParams)
              .filter((key) => missingParams[key] !== null)
              .map((key) => `\t${key}: string;`)
              .join("\n")
          : "";

        if (newTypes.length === 0) {
          return;
        } else if (!schemaType) {
          setSchemaType(
            `
export interface ${API_TYPE_NAMES.APIQueryParams} {
${newTypes}
}`.trim()
          );
          return;
        } else {
          let newType = schemaType
            .split("\n")
            .map((line) => {
              if (
                line.includes("export interface") &&
                !line.trim().startsWith("//")
              ) {
                return `${line}\n${newTypes}`;
              } else {
                return line;
              }
            })
            .join("\n");
          setSchemaType(newType);
        }
      } catch (e) {
        console.debug(e);
        alert("Invalid Query. Use dev tools to debug console logs.");
      }
    }

    if (missingParams) {
      initializeDefault();
    }
  }, [missingParams]);

  return (
    <>
      <div className="grid grid-rows-[auto,1fr,1fr] flex-1 h-full z-20 overflow-x-auto">
        {showJSONEditor && needsOnboarding && process.env.NEXT_PUBLIC_ENV ? (
          <EditorQueryOnboarding className="row-span-3 p-6" />
        ) : (
          <>
            <div className="p-2 px-8 text-sm border-b border-recipe-slate overflow-x-auto h-fit">
              {isEmpty ? (
                "Enter query params as a key value object below"
              ) : (
                <>
                  <span className="w-fit break-all">{editorUrl}</span>
                  <span
                    className={classNames(
                      "mt-2 bg-accent py-1 rounded-md text-white w-fit break-all",
                      error && "bg-error"
                    )}
                  >
                    {error ?? queryString}
                  </span>
                </>
              )}
            </div>
            {showJSONEditor ? (
              <div className="relative flex w-full">
                <EditorViewWithSchema
                  value={editorQuery}
                  setValue={setEditorQuery}
                  jsonSchema={editorQuerySchemaJSON}
                  key={`${currentSession?.id || "default"}-json-query`}
                  className="flex-1"
                  typeName={API_TYPE_NAMES.APIQueryParams}
                />
              </div>
            ) : (
              <div className="row-span-2">
                <InitializeSchema type={EditorParamView.Query} />
              </div>
            )}
            {showJSONEditor && (
              <EditorTypeScript
                key={`${currentSession?.id || "default"}-types-query`}
                setSchemaJSON={setSchemaJSON}
                setSchemaType={setSchemaType}
                editorParamView={EditorParamView.Query}
                schemaType={schemaType}
                defaultExport={API_TYPE_NAMES.APIQueryParams}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};
