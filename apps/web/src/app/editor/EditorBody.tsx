"use client";

import { RecipeMutationContentType } from "types/enums";
import { useRecipeSessionStore } from "ui/state/recipeSession";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const DARKTHEME_SETTINGS = {
  name: "recipeui-dark",
  config: {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1d232a",
    },
  },
};

const DEFAULT_MONACO_OPTIONS = {
  minimap: {
    enabled: false,
  },
  renderLineHighlight: "none",
  fixedOverflowWidgets: true,
} as const;

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

import MonacoEditor, {
  OnMount,
  BeforeMount,
  Monaco,
} from "@monaco-editor/react";
import { use, useEffect, useRef, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";

export const JSONEditorContainer = () => {
  return (
    <div className="grid grid-rows-2 flex-1 h-full z-20">
      <JSONEditorBody />
      <JSONEditorType />
    </div>
  );
};

export const JSONEditorBody = () => {
  const { isDarkMode } = useDarkMode();
  const [isEditorReady, setIsEditorReady] = useState(false);

  const monacoRef = useRef<Monaco>();

  const handleEditorDidMount: OnMount = (_valueGetter) => {
    setIsEditorReady(true);
    monacoRef.current = _valueGetter as unknown as Monaco;
  };

  const editorBody = useRecipeSessionStore((state) => state.editorBody);
  const setEditoryBody = useRecipeSessionStore((state) => state.setEditorBody);

  const editorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.editorBodySchemaJson
  );

  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemaValidation: "error",
      schemas: [
        {
          uri: "API_REQUEST", // id of the first schema
          fileMatch: ["*"],
          schema: editorBodySchemaJSON,
        },
      ],
    });
  }, [editorBodySchemaJSON]);

  // OnMount
  const handleEditorWillMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemaValidation: "error",
      schemas: [
        {
          uri: "API_REQUEST", // id of the first schema
          fileMatch: ["*"],
          schema: editorBodySchemaJSON,
        },
      ],
    });

    if (isDarkMode) {
      monaco.editor.defineTheme(
        DARKTHEME_SETTINGS.name,
        DARKTHEME_SETTINGS.config as any
      );
      monaco.editor.setTheme(DARKTHEME_SETTINGS.name);
    }
  };

  return (
    <MonacoEditor
      className="border-t pt-2"
      language="json"
      theme={isDarkMode ? DARKTHEME_SETTINGS.name : "light"}
      value={editorBody}
      onChange={(newCode) => {
        setEditoryBody(newCode || "");
      }}
      beforeMount={handleEditorWillMount}
      // onMount={handleEditorDidMount}
      options={{
        ...DEFAULT_MONACO_OPTIONS,
      }}
    />
  );
};

export const JSONEditorType = () => {
  const { isDarkMode } = useDarkMode();
  const [isEditorReady, setIsEditorReady] = useState(false);

  const monacoRef = useRef<Monaco>();

  const handleEditorDidMount: OnMount = (_valueGetter) => {
    setIsEditorReady(true);
    monacoRef.current = _valueGetter as unknown as Monaco;
  };

  const editBodySchemaType = useRecipeSessionStore(
    (state) => state.editorBodySchemaType
  );

  const setEditBodySchemaType = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaType
  );

  const setEditorBodySchemaJson = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaJson
  );

  // OnMount
  const handleEditorWillMount: BeforeMount = (monaco) => {
    if (isDarkMode) {
      monaco.editor.defineTheme(
        DARKTHEME_SETTINGS.name,
        DARKTHEME_SETTINGS.config as any
      );
      monaco.editor.setTheme(DARKTHEME_SETTINGS.name);
    }
  };

  const [hasChanged, setHasChanged] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const changesMade = useDebounce(editBodySchemaType, 1000);
  const finalizedChanges = useDebounce(editBodySchemaType, 3000);
  useEffect(() => {
    if (hasChanged) setHasChanged(false);
    if (hasError) setHasError(false);
  }, [editBodySchemaType]);

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
        body: JSON.stringify({ types: editBodySchemaType }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          const value = await res.json();
          setEditorBodySchemaJson(
            value.definitions["APIRequest"] || {
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
        value={editBodySchemaType}
        onChange={(newCode) => {
          setEditBodySchemaType(newCode || "");
        }}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={DEFAULT_MONACO_OPTIONS}
      />
      {(hasChanged || hasError) && (
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
              "Autosaving..."
            ))}
          {hasError && "Bad types"}
        </div>
      )}
    </div>
  );
};
