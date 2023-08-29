"use client";
import MonacoEditor, { BeforeMount, Monaco } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { useDarkMode } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
  LIGHTTHEME_SETTINGS,
} from "@/app/editor/common";
import { JSONSchema6 } from "json-schema";
import classNames from "classnames";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRecipeSessionStore } from "ui/state/recipeSession";
import { API_SAMPLES } from "ui/utils/constants/main";

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
      className="pt-2"
      language="json"
      theme={isDarkMode ? DARKTHEME_SETTINGS.name : LIGHTTHEME_SETTINGS.name}
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
  monaco.editor.defineTheme(
    LIGHTTHEME_SETTINGS.name,
    LIGHTTHEME_SETTINGS.config as any
  );
};

const setJSONDiagnosticOptions = (monaco: Monaco, jsonSchema: JSONSchema6) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemaValidation: "error",
    schemas: [
      {
        uri: monaco.Uri.parse("API_REQUEST").toString(),
        fileMatch: ["*"],
        schema: jsonSchema,
      },
    ],
  });
};

export function InitializeSchema({ type }: { type: "query" | "body" | "url" }) {
  const editQueryType = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaType
  );
  const editBodyType = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaType
  );
  const setEditorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaJSON
  );
  const setEditorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaJSON
  );
  const setEditorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaJSON
  );

  const setEditorURLSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );

  const onSubmit = () => {
    if (type === "query") {
      editQueryType(API_SAMPLES.API_SAMPLE_QUERY_PARAMS_TYPE);
      setEditorQuerySchemaJSON({});
    } else if (type === "body") {
      editBodyType(API_SAMPLES.API_SAMPLE_REQUEST_BODY_TYPE);
      setEditorBodySchemaJSON({});
    } else if (type === "url") {
      setEditorURLSchemaType(API_SAMPLES.API_SAMPLE_URL_PARAMS_TYPE);
      setEditorURLSchemaJSON({});
    }
  };

  return (
    <div className="h-full flex justify-center items-center border-t border-recipe-slate">
      <button className="btn btn-accent" onClick={onSubmit}>
        Initialize {type} schema
      </button>
    </div>
  );
}
