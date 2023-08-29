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

export const JSONEditorContainer = () => {
  const editorBody = useRecipeSessionStore((state) => state.editorBody);
  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);

  const editorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.editorBodySchemaJSON
  );
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div className="grid grid-rows-2 flex-1 h-full z-20">
      {editorBodySchemaJSON ? (
        <EditorViewWithSchema
          value={editorBody}
          setValue={setEditorBody}
          jsonSchema={editorBodySchemaJSON}
        />
      ) : (
        <InitializeSchema type="body" />
      )}
      <JSONEditorType key={currentSession?.id || "default"} />
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
    (state) => state.setEditorBodySchemaJSON
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
          console.error(err);
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
    return <InitializeSchema type="body" />;
  }

  return (
    <div className="relative">
      <MonacoEditor
        className="border-t pt-2"
        language="typescript"
        theme={isDarkMode ? DARKTHEME_SETTINGS.name : LIGHTTHEME_SETTINGS.name}
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
