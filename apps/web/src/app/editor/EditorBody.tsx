"use client";

import { RecipeMutationContentType } from "types/enums";
import { useRecipeSessionStore } from "ui/state/recipeSession";

export function EditorBody() {
  const editorBodyType = useRecipeSessionStore((state) => state.editorBodyType);
  const setEditorBodyType = useRecipeSessionStore(
    (state) => state.setEditorBodyType
  );

  return (
    <div className="flex-1 overflow-x-auto sm:block hidden z-20">
      {editorBodyType === null && (
        <select
          className="select select-bordered w-full max-w-xs m-4"
          onChange={(e) => {
            setEditorBodyType(
              (e.target.value || null) as RecipeMutationContentType
            );
          }}
        >
          <option value={undefined}>None</option>
          <option value={RecipeMutationContentType.JSON}>JSON Body</option>
          <option value={RecipeMutationContentType.FormData}>
            FormData Body
          </option>
        </select>
      )}

      {editorBodyType === RecipeMutationContentType.JSON && (
        <JSONEditorContainer />
      )}
    </div>
  );
}

import MonacoEditor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
} from "@/app/editor/common";
import { API_TYPE_NAMES } from "ui/utils/constants/main";
import {
  AutoSaveError,
  EditorViewWithSchema,
  handleEditorWillMount,
} from "@/app/editor/EditorViewWithSchema";

export const JSONEditorContainer = () => {
  const editorBody = useRecipeSessionStore((state) => state.editorBody);
  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);

  const editorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.editorBodySchemaJson
  );

  return (
    <div className="grid grid-rows-2 flex-1 h-full z-20">
      <EditorViewWithSchema
        value={editorBody}
        setValue={setEditorBody}
        jsonSchema={editorBodySchemaJSON}
      />
      <JSONEditorType />
    </div>
  );
};

export const JSONEditorType = () => {
  const { isDarkMode } = useDarkMode();
  const schemaType = useRecipeSessionStore(
    (state) => state.editorBodySchemaType
  );
  const editSchemaType = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaType
  );
  const editSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaJson
  );
  const [hasChanged, setHasChanged] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const changesMade = useDebounce(schemaType, 1000);
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
      fetch("https://recipe-translator.fly.dev/ts-to-jsonschema", {
        body: JSON.stringify({ types: schemaType }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          const value = await res.json();
          editSchemaJSON(
            value.definitions[API_TYPE_NAMES.APIRequestParams] || {
              additionalProperties: true,
              type: "object",
            }
          );
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