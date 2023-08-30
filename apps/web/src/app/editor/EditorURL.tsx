"use client";

import { useRecipeSessionStore } from "ui/state/recipeSession";
import { useMemo } from "react";
import { useDebounce } from "usehooks-ts";
import { EditorParamView } from "@/app/editor/CodeEditors/common";
import {
  EditorViewWithSchema,
  InitializeSchema,
} from "@/app/editor/CodeEditors/EditorJSON";
import classNames from "classnames";
import { EditorTypeScript } from "@/app/editor/CodeEditors/EditorTypeScript";

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

  return (
    <div className="grid grid-rows-[auto,1fr,1fr] flex-1 h-full z-20 overflow-x-auto">
      <div className="p-2 px-8 text-sm border-b border-recipe-slate">
        <EditorURLHighlight />
      </div>
      {editorURLSchemaJSON || editorURLCode ? (
        <EditorViewWithSchema
          value={editorURLCode}
          setValue={setEditorURLCode}
          jsonSchema={editorURLSchemaJSON}
        />
      ) : (
        <InitializeSchema type={EditorParamView.Url} />
      )}
      <EditorTypeScript
        key={currentSession?.id || "default"}
        editorParamView={EditorParamView.Url}
        schemaType={schemaType}
        setSchemaJSON={setSchemaJSON}
        setSchemaType={setSchemaType}
      />
    </div>
  );
};

export function EditorURLHighlight() {
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

  const matches = editorURL.match(/{(\w+)}/g);

  const highlightedText = editorURL.split("/").map((word, i) => {
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
