"use client";

import MonacoEditor from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
  EditorParamView,
  LIGHTTHEME_SETTINGS,
} from "@/app/editor/CodeEditors/common";
import {
  AutoSaveError,
  InitializeSchema,
  handleEditorWillMount,
} from "@/app/editor/CodeEditors/EditorJSON";

import { fetchTypeScriptFromJSON } from "ui/fetchers/editor";
import { JSONSchema6 } from "json-schema";

/*
  This is more of a UX pattern. We want to initially flag that we noticed the user has
  made changes, but we don't want to prematurely interrupt them if they're still typing.
  3 seconds is a decent signal time to assume we can do an update.
*/
function useDebouncedEditorChanges({
  latestTypeValue,
  setSchemaJSON,
}: {
  latestTypeValue: string | null;
  setSchemaJSON: (value: JSONSchema6 | null) => void;
}) {
  const changesMade = useDebounce(latestTypeValue, 1000);
  const changesFinalized = useDebounce(latestTypeValue, 3000);

  const [preparingChange, setPreparingChange] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (preparingChange) setPreparingChange(false);
    if (hasError) setHasError(false);
  }, [latestTypeValue]);

  useEffect(() => {
    if (!preparingChange && changesMade !== changesFinalized) {
      setPreparingChange(true);
    }
  }, [changesMade]);

  useEffect(() => {
    if (preparingChange) {
      if (!latestTypeValue) {
        setSchemaJSON(null);
        setPreparingChange(false);
        return;
      }

      setRefreshing(true);

      // We have to migrate off of here eventually
      // Will mod this package so that it doesn't need a server
      fetchTypeScriptFromJSON({ types: latestTypeValue })
        .then(async (res) => {
          const value = await res.json();

          if (!res.ok) {
            throw new Error("Failed to fetch");
          }

          setSchemaJSON(value);
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
          setPreparingChange(false);
        });
    }
  }, [changesFinalized]);

  return {
    changesFinalized,
    preparingChange,
    hasError,
    refreshing,
  };
}

export const EditorTypeScript = ({
  editorParamView,
  schemaType,

  setSchemaType,
  setSchemaJSON,
}: {
  editorParamView: EditorParamView;
  schemaType: string | null;

  setSchemaType: (value: string | null) => void;
  setSchemaJSON: (value: JSONSchema6 | null) => void;
}) => {
  const { isDarkMode } = useDarkMode();

  const { preparingChange, refreshing, hasError } = useDebouncedEditorChanges({
    latestTypeValue: schemaType,
    setSchemaJSON: setSchemaJSON,
  });

  if (!schemaType) {
    return <InitializeSchema type={editorParamView} />;
  }

  return (
    <div className="relative">
      <MonacoEditor
        className="border-t border-recipe-slate pt-2"
        language="typescript"
        theme={isDarkMode ? DARKTHEME_SETTINGS.name : LIGHTTHEME_SETTINGS.name}
        value={schemaType}
        onChange={(newCode) => {
          setSchemaType(newCode || "");
        }}
        beforeMount={handleEditorWillMount}
        options={DEFAULT_MONACO_OPTIONS}
      />
      <AutoSaveError
        hasChanged={preparingChange}
        hasError={hasError}
        refreshing={refreshing}
      />
    </div>
  );
};
