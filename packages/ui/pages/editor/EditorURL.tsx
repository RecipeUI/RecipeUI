"use client";

import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { useMemo } from "react";
import { useDebounce, useLocalStorage } from "usehooks-ts";
import { EditorParamView } from "./CodeEditors/common";
import {
  EditorViewWithSchema,
  InitializeSchema,
} from "./CodeEditors/EditorJSON";
import classNames from "classnames";
import { EditorTypeScript } from "./CodeEditors/EditorTypeScript";
import { API_TYPE_NAMES } from "../../utils/constants/recipe";
import { ONBOARDING_CONSTANTS } from "../../utils/constants/main";
import { EditorURLOnboarding } from "./EditorOnboarding/EditorURLOnboarding";

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
  const [onboardedToURL] = useLocalStorage(
    ONBOARDING_CONSTANTS.URL_ONBOARDING,
    false
  );

  return (
    <div className="grid grid-rows-[auto,1fr,1fr] flex-1 h-full z-20 overflow-x-auto">
      <div className="p-2 px-8 text-sm border-b border-recipe-slate tooltip tooltip-error text-start overflow-x-scroll break-all">
        <EditorURLHighlightContainer />
      </div>
      {showJSONEditor ? (
        <EditorViewWithSchema
          key={`${currentSession?.id || "default"}-json-url`}
          value={editorURLCode}
          setValue={setEditorURLCode}
          jsonSchema={editorURLSchemaJSON}
          typeName={API_TYPE_NAMES.APIUrlParams}
        />
      ) : (
        <InitializeSchema type={EditorParamView.Url} />
      )}
      <EditorTypeScript
        key={`${currentSession?.id || "default"}-types-url`}
        editorParamView={EditorParamView.Url}
        schemaType={schemaType}
        setSchemaJSON={setSchemaJSON}
        setSchemaType={setSchemaType}
        defaultExport={API_TYPE_NAMES.APIUrlParams}
      />
      {showJSONEditor && !onboardedToURL && <EditorURLOnboarding />}
    </div>
  );
};

export function EditorURLHighlightContainer() {
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

  return <URLHighlight url={editorURL} urlState={urlState} />;
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
