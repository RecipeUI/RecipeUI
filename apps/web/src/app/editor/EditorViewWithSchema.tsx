"use client";
import MonacoEditor, { BeforeMount, Monaco } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { useDarkMode } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
} from "@/app/editor/common";
import { JSONSchema6 } from "json-schema";
import classNames from "classnames";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function EditorViewWithSchema({
  value,
  setValue,
  jsonSchema,
}: {
  value: string;
  setValue: (value: string) => void;
  jsonSchema: JSONSchema6;
}) {
  const { isDarkMode } = useDarkMode();
  const monacoRef = useRef<Monaco>();

  useEffect(() => {
    if (!monacoRef.current) return;

    setJSONDiagnosticOptions(monacoRef.current, jsonSchema);
  }, [jsonSchema]);

  // OnMount
  const handleEditorWillMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;

    setJSONDiagnosticOptions(monaco, jsonSchema);
  };

  return (
    <MonacoEditor
      className="border-t pt-2"
      language="json"
      theme={isDarkMode ? DARKTHEME_SETTINGS.name : "light"}
      value={value}
      onChange={(newCode) => {
        setValue(newCode || "");
      }}
      beforeMount={handleEditorWillMount}
      options={DEFAULT_MONACO_OPTIONS}
    />
  );
}

export function AutoSaveError({
  hasChanged,
  hasError,
  refreshing,
}: {
  hasChanged: boolean;
  hasError: boolean;
  refreshing: boolean;
}) {
  if (!hasChanged && !hasError) return null;

  return (
    <div
      className={classNames(
        "absolute top-3 right-8",
        "animate-pulse btn btn-sm opacity-0 transition-opacity duration-1000 delay-1000",
        hasError ? "btn-error" : "btn-accent"
      )}
    >
      {hasChanged &&
        (refreshing ? (
          <ArrowPathIcon className="w-6 h-6 animate-spin" />
        ) : (
          <ArrowPathIcon className="w-6 h-6 animate-spin" />
        ))}
      {hasError && "Bad types"}
    </div>
  );
}

export const handleEditorWillMount: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(
    DARKTHEME_SETTINGS.name,
    DARKTHEME_SETTINGS.config as any
  );
};

const setJSONDiagnosticOptions = (monaco: Monaco, jsonSchema: JSONSchema6) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemaValidation: "error",
    schemas: [
      {
        uri: "API_REQUEST",
        fileMatch: ["*"],
        schema: jsonSchema,
      },
    ],
  });
};
