"use client";

import { useRecipeSessionStore } from "ui/state/recipeSession";

import MonacoEditor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
} from "@/app/editor/common";
import {
  API_LOCAL_PROCESSING_URLS,
  API_TYPE_NAMES,
} from "ui/utils/constants/main";
import {
  AutoSaveError,
  EditorViewWithSchema,
  handleEditorWillMount,
} from "@/app/editor/EditorViewWithSchema";

export const EditorQuery = () => {
  const editorQuery = useRecipeSessionStore((state) => state.editorQuery);
  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);
  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);
  const editorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.editorQuerySchemaJSON
  );

  const isEmpty = !editorQuery;

  const newQueryChanges = useDebounce(editorQuery, 500);
  const urlParams = useMemo(() => {
    if (!newQueryChanges) return "Enter query params as key value pairs below";

    try {
      const params = JSON.parse(newQueryChanges) as Record<string, string>;

      return `${editorUrl}?${new URLSearchParams(params).toString()}`;
    } catch (e) {
      return "Invalid query params";
    }
  }, [editorUrl, newQueryChanges]);

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div className="grid grid-rows-[auto,1fr,1fr] flex-1 h-full z-20">
      <div className="p-2 px-8 text-sm">
        {isEmpty ? "Enter query params as a key value object below" : urlParams}
      </div>
      <EditorViewWithSchema
        value={editorQuery}
        setValue={setEditorQuery}
        jsonSchema={editorQuerySchemaJSON}
      />
      <EditorType key={currentSession?.id || "default"} />
    </div>
  );
};

const EditorType = () => {
  const { isDarkMode } = useDarkMode();
  const schemaType = useRecipeSessionStore(
    (state) => state.editorQuerySchemaType
  );
  const editSchemaType = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaType
  );
  const editSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaJSON
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

  return (
    <div className="relative">
      <MonacoEditor
        className="border-t pt-2"
        language="typescript"
        theme={isDarkMode ? DARKTHEME_SETTINGS.name : "light"}
        value={schemaType}
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
