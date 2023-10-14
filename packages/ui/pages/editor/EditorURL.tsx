"use client";

import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { useCallback, useMemo } from "react";
import { useDebounce } from "usehooks-ts";
import { EditorParamView } from "./CodeEditors/common";
import {
  EditorViewWithSchema,
  InitializeSchema,
} from "./CodeEditors/EditorJSON";
import classNames from "classnames";
import { EditorTypeScript } from "./CodeEditors/EditorTypeScript";
import { API_TYPE_NAMES } from "../../utils/constants/recipe";
import { EditorURLOnboarding } from "./EditorOnboarding/EditorURLOnboarding";
import { useNeedsOnboarding } from "../../state/apiSession/OnboardingAPI";
import { ONBOARDING_CONSTANTS } from "utils/constants";
import { commentAllLines } from "../../utils/main";

export const EditorURL = () => {
  const editorURLCode = useRecipeSessionStore((state) => state.editorURLCode);
  const setEditorURLCode = useRecipeSessionStore(
    (state) => state.setEditorURLCode
  );

  const editorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.editorURLSchemaJSON
  );

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const schemaType = useRecipeSessionStore(
    (state) => state.editorURLSchemaType
  );

  const setSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaJSON
  );

  const setSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );

  const showJSONEditor = Boolean(editorURLSchemaJSON || editorURLCode);

  const { needsOnboarding } = useNeedsOnboarding(
    ONBOARDING_CONSTANTS.URL_ONBOARDING
  );

  const { editorURL, urlState, hasCorrectState } = useURLState();

  const editorURLSchemaType = useRecipeSessionStore(
    (state) => state.editorURLSchemaType
  );
  const setEditorURLSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );

  const initializeDefaultSchema = useCallback(() => {
    const newUrlState: Record<string, unknown> = {};
    const matches = editorURL.match(/{(\w+)}/g) || [];
    for (const match of matches) {
      if (urlState[match] !== undefined) {
        newUrlState[match] = urlState[match];
        continue;
      } else {
        newUrlState[match] = "VALUE_HERE";
      }
    }

    setEditorURLCode(JSON.stringify(newUrlState, null, 2));

    // This part is not an amazing fix but it should get the job done
    const oldTypes = commentAllLines(editorURLSchemaType);

    const newTypes = `
export interface ${API_TYPE_NAMES.APIUrlParams} {
  ${Object.keys(newUrlState)
    .map((key) => `\t"${key}": string;`)
    .join("\n")}
}
              `.trim();

    setEditorURLSchemaType(oldTypes ? `${newTypes}\n\n${oldTypes}` : newTypes);
  }, [
    editorURL,
    editorURLSchemaType,
    setEditorURLCode,
    setEditorURLSchemaType,
    urlState,
  ]);

  return (
    <div className="grid grid-rows-[minmax(min-content,max-content),1fr,1fr] flex-1 h-full z-20 overflow-x-auto">
      <div className="p-2 px-8 text-sm border-b border-recipe-slate tooltip tooltip-error text-start overflow-x-auto break-all">
        <URLHighlight url={editorURL} urlState={urlState} />
      </div>
      {showJSONEditor ? (
        <div className="flex relative">
          <EditorViewWithSchema
            className="flex-1"
            key={`${currentSession?.id || "default"}-json-url`}
            value={editorURLCode}
            setValue={setEditorURLCode}
            jsonSchema={editorURLSchemaJSON}
            typeName={API_TYPE_NAMES.APIUrlParams}
          />
          {!hasCorrectState && (
            <button
              className="absolute btn btn-warning btn-sm right-0 top-0 mt-2 mr-2"
              data-tip="This will make sure your code has the same params as your URL."
              onClick={initializeDefaultSchema}
            >
              Auto Fix
            </button>
          )}
        </div>
      ) : (
        <InitializeSchema
          type={EditorParamView.Url}
          customAction={initializeDefaultSchema}
        />
      )}
      <EditorTypeScript
        key={`${currentSession?.id || "default"}-types-url`}
        editorParamView={EditorParamView.Url}
        schemaType={schemaType}
        setSchemaJSON={setSchemaJSON}
        setSchemaType={setSchemaType}
        defaultExport={API_TYPE_NAMES.APIUrlParams}
      />
      {showJSONEditor && needsOnboarding && process.env.NEXT_PUBLIC_ENV && (
        <EditorURLOnboarding />
      )}
    </div>
  );
};

function useURLState() {
  const editorURL = useRecipeSessionStore((state) => state.editorUrl);
  const editorURLCode = useRecipeSessionStore((state) => state.editorURLCode);
  const debouncedURLCodeChanges = useDebounce(editorURLCode, 500);

  const urlState: Record<string, string> = useMemo(() => {
    try {
      return JSON.parse(debouncedURLCodeChanges);
    } catch (e) {
      return {};
    }
  }, [debouncedURLCodeChanges]);

  const hasCorrectState = useMemo(() => {
    const matches = editorURL.match(/{(\w+)}/g)?.map((m) => m) || [];
    const urlParams = new Set(matches);
    const editorParams = new Set(Object.keys(urlState));

    return (
      urlParams.size === editorParams.size &&
      matches.every((m) => editorParams.has(m))
    );
  }, [editorURL, urlState]);

  return {
    editorURL,
    hasCorrectState,
    urlState,
  };
}

export function URLHighlight({
  url,
  urlState,
}: {
  url: string;
  urlState: Record<string, string>;
}) {
  const matches = url.match(/{(\w+)}/g);

  const highlightedText = url.split("/").map((word, i) => {
    let match = matches?.find((m) => word.includes(m));
    if (match) {
      const wordWithoutBrackets = match.slice(1, -1);
      const textAfterWord = word.split(match)[1];

      const value = urlState[match];
      return (
        <span key={i}>
          /
          {
            <span
              className={classNames(
                "p-1 rounded-md text-white",
                value !== undefined ? "bg-accent" : "bg-error"
              )}
            >{`{${wordWithoutBrackets}=${value}}`}</span>
          }
          {textAfterWord}
        </span>
      );
    } else {
      return <span key={i}>{i !== 0 ? "/" + word : word}</span>;
    }
  });

  return <>{highlightedText}</>;
}
