"use client";

import { useRecipeSessionStore } from "ui/state/recipeSession";

import MonacoEditor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
  LIGHTTHEME_SETTINGS,
} from "@/app/editor/common";
import {
  API_LOCAL_PROCESSING_URLS,
  API_TYPE_NAMES,
} from "ui/utils/constants/main";
import {
  AutoSaveError,
  EditorViewWithSchema,
  InitializeSchema,
  handleEditorWillMount,
} from "@/app/editor/EditorViewWithSchema";
import { getIsEmptySchema } from "ui/utils/main";
import classNames from "classnames";

export const EditorURL = () => {
  const editorURLCode = useRecipeSessionStore((state) => state.editorURLCode);
  const setEditorURLCode = useRecipeSessionStore(
    (state) => state.setEditorURLCode
  );

  const editorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.editorURLSchemaJSON
  );

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div className="grid grid-rows-[auto,1fr,1fr] flex-1 h-full z-20 overflow-x-auto">
      <div className="p-2 px-8 text-sm border-b border-recipe-slate">
        <EditorURLHighlight />
      </div>
      {editorURLSchemaJSON ? (
        <EditorViewWithSchema
          value={editorURLCode}
          setValue={setEditorURLCode}
          jsonSchema={editorURLSchemaJSON}
        />
      ) : (
        <InitializeSchema type="url" />
      )}
      <EditorType key={currentSession?.id || "default"} />
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
                value ? "bg-accent" : "bg-error"
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

const EditorType = () => {
  const { isDarkMode } = useDarkMode();
  const schemaType = useRecipeSessionStore(
    (state) => state.editorURLSchemaType
  );
  const editSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );
  const editSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaJSON
  );

  const [hasChanged, setHasChanged] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const changesMade = useDebounce(schemaType, 2000);
  const finalizedChanges = useDebounce(schemaType, 3000);
  useEffect(() => {
    if (hasChanged) setHasChanged(false);
    if (hasError) setHasError(false);
  }, [schemaType]);

  useEffect(() => {
    if (!hasChanged && changesMade !== finalizedChanges) {
      setHasChanged(true);
    } else {
      setHasChanged(false);
    }
  }, [changesMade]);

  useEffect(() => {
    if (hasChanged) {
      if (schemaType === "") {
        editSchemaJSON(null);
        setHasChanged(false);
        return;
      }

      setRefreshing(true);

      // We have to migrate off of here eventually
      // Will mod this package so that it doesn't need a server
      fetch(API_LOCAL_PROCESSING_URLS.TS_TO_JSON, {
        body: JSON.stringify({ types: schemaType }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          const value = await res.json();
          editSchemaJSON(value);
        })
        .catch((err) => {
          setHasError(true);
          setTimeout(() => {
            setHasError(false);
          }, 3000);
        })
        .finally(() => {
          setRefreshing(false);
          setHasChanged(false);
        });
    }
  }, [finalizedChanges]);

  const [hasError, setHasError] = useState(false);

  if (!schemaType) {
    return <InitializeSchema type="url" />;
  }

  return (
    <div className="relative">
      <MonacoEditor
        className="border-t border-recipe-slate pt-2"
        language="typescript"
        theme={isDarkMode ? DARKTHEME_SETTINGS.name : LIGHTTHEME_SETTINGS.name}
        value={schemaType || ""}
        onChange={(newCode) => {
          editSchemaType(newCode || "");
        }}
        beforeMount={handleEditorWillMount}
        options={DEFAULT_MONACO_OPTIONS}
      />
      <AutoSaveError
        hasChanged={hasChanged}
        hasError={hasError}
        refreshing={refreshing}
      />
    </div>
  );
};
