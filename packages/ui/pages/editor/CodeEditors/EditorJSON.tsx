"use client";
import MonacoEditor, {
  BeforeMount,
  Monaco,
  OnMount,
} from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
  EditorParamView,
  LIGHTTHEME_SETTINGS,
} from "./common";
import { JSONSchema6, JSONSchema6Definition } from "json-schema";
import classNames from "classnames";
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { useRecipeSessionStore } from "../../../../ui/state/recipeSession";
import { produce } from "immer";
import { ContentTypeLabel, RecipeMutationContentType } from "types/enums";
import { API_SAMPLES, API_TYPE_NAMES } from "../../../utils/constants/recipe";
import { Modal } from "../../../components/Modal";
import { FormFieldWrapper } from "../../../modules/components/FormFieldWrapper";
import { EditorActionWrapper } from "./EditorAction";
import { ImportJSONToTypeScript } from "./EditorTypeScript";

interface EditorJSONProps {
  value: string;
  setValue: (value: string) => void;
  jsonSchema: JSONSchema6 | null;
  typeName: (typeof API_TYPE_NAMES)[keyof typeof API_TYPE_NAMES];
  className?: string;
}

export function EditorViewWithSchema({
  value,
  setValue,
  jsonSchema,
  typeName,
  className,
}: EditorJSONProps) {
  const { isDarkMode } = useDarkMode();
  const monacoRef = useRef<Monaco>();

  function renderModelMarkers() {
    if (!monacoRef.current) return;

    monacoRef.current.editor.getModels().forEach((model) => {
      if (model.getLanguageId() === "json") {
        const matches = model?.findMatches(
          '"<<.*?>>"',
          true,
          true,
          false,
          null,
          true
        );

        monacoRef.current!.editor.setModelMarkers(
          model,
          "me",
          matches.map((match) => ({
            startLineNumber: match.range.startLineNumber,
            startColumn: match.range.startColumn,
            endColumn: match.range.endColumn,
            endLineNumber: match.range.endLineNumber,
            message: "ENV: This is an environment variable",
            severity: monacoRef.current!.MarkerSeverity.Info,
          }))
        );
      }
    });
  }

  useEffect(() => {
    if (!monacoRef.current) return;

    setJSONDiagnosticOptions(monacoRef.current, typeName, jsonSchema);
  }, [jsonSchema]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    setJSONDiagnosticOptions(monaco, typeName, jsonSchema);
    renderModelMarkers();

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  };

  return (
    <MonacoEditor
      className={classNames("pt-2 flex-1", className)}
      language="json"
      keepCurrentModel={false}
      theme={isDarkMode ? DARKTHEME_SETTINGS.name : LIGHTTHEME_SETTINGS.name}
      value={value}
      onChange={(newCode) => {
        setValue(newCode || "");
      }}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorMount}
      options={DEFAULT_MONACO_OPTIONS}
    />
  );
}

export function EditorViewWithSchemaBody(props: EditorJSONProps) {
  const [showChangeType, setShowChangeType] = useState(false);
  const editorBodyType = useRecipeSessionStore((state) => state.editorBodyType);

  return (
    <>
      <EditorActionWrapper
        label={
          ContentTypeLabel[editorBodyType || RecipeMutationContentType.JSON]
        }
        onClick={() => {
          setShowChangeType(!showChangeType);
        }}
      >
        <EditorViewWithSchema {...props} />
      </EditorActionWrapper>

      {showChangeType && (
        <BodyModal
          onClose={() => {
            setShowChangeType(false);
          }}
        />
      )}
    </>
  );
}

export function BodyModal({ onClose }: { onClose: () => void }) {
  const editorBodyType = useRecipeSessionStore((state) => state.editorBodyType);
  const setEditorBodyType = useRecipeSessionStore(
    (state) => state.setEditorBodyType
  );

  const [newBodyType, setNewBodyType] = useState<RecipeMutationContentType>(
    editorBodyType || RecipeMutationContentType.JSON
  );

  return (
    <Modal header="Change Body" onClose={onClose}>
      <form
        className="w-full space-y-4 mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          setEditorBodyType(newBodyType);
          onClose();
        }}
      >
        <FormFieldWrapper label="Body Type">
          <select
            className="select select-bordered w-full max-w-xs"
            value={newBodyType}
            onChange={(e) =>
              setNewBodyType(e.target.value as RecipeMutationContentType)
            }
          >
            <option value={RecipeMutationContentType.JSON}>
              {RecipeMutationContentType.JSON}
            </option>
            <option value={RecipeMutationContentType.FormData}>
              {RecipeMutationContentType.FormData}
            </option>
          </select>
        </FormFieldWrapper>
        <button className="btn btn-sm btn-neutral mt-2" type="submit">
          Submit{" "}
        </button>
        <div className="alert">
          <span>Tip: CMD + S will auto format the JSON inside the editor.</span>
        </div>
      </form>
    </Modal>
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

const setJSONDiagnosticOptions = (
  monaco: Monaco,
  typeName: string,
  jsonSchema?: JSONSchema6 | null
) => {
  const wrapSchemaInVariables = (schema: JSONSchema6, variables?: string[]) => {
    if (!variables || variables.length === 0) return schema;

    return produce(schema, (draft) => {
      draft.definitions = {
        ...draft.definitions,
        RecipeEnv: {
          type: "string",
          enum: variables.map((variable) => `<<${variable}>>`),
        },
      };

      const recurSchema = (innerSchema?: JSONSchema6Definition) => {
        if (!innerSchema || typeof innerSchema === "boolean") return;

        if (innerSchema.properties) {
          const properties = Object.keys(innerSchema.properties);
          for (const property of properties) {
            recurSchema(innerSchema.properties[property]);
          }
        }

        if (innerSchema.items) {
          if (Array.isArray(innerSchema.items)) {
            for (const item of innerSchema.items) {
              recurSchema(item);
            }
          } else {
            recurSchema(innerSchema.items);
          }
        }

        if (innerSchema.anyOf) {
          innerSchema.anyOf.push({
            $ref: "#/definitions/RecipeEnv",
          });
        } else {
          const { type, ...properties } = innerSchema;

          innerSchema.anyOf = [
            {
              ...properties,
              type,
            },
            {
              $ref: "#/definitions/RecipeEnv",
            },
          ];

          for (const property of Object.keys(properties)) {
            delete innerSchema[property as keyof typeof innerSchema];
          }

          delete innerSchema.type;
        }
      };

      const properties = Object.keys(draft.properties || {});
      for (const property of properties) {
        recurSchema(draft.properties![property]);
      }
    });
  };

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemaValidation: "error",
    allowComments: true,
    schemas: jsonSchema
      ? [
          {
            uri: monaco.Uri.parse(typeName).toString(),
            fileMatch: ["*"],
            schema: wrapSchemaInVariables(jsonSchema),
          },
        ]
      : [],
  });
};

export function InitializeSchema({
  type,
  customAction,
  allowImport,
}: {
  type: EditorParamView;
  customAction?: () => void;
  allowImport?: boolean;
}) {
  const editQueryType = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaType
  );
  const editBodyType = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaType
  );

  const setEditorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaJSON
  );
  const setEditorBodyType = useRecipeSessionStore(
    (state) => state.setEditorBodyType
  );
  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);

  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);

  const setEditorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaJSON
  );
  const setEditorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaJSON
  );

  const setEditorURLSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );

  const setEditorUrlCode = useRecipeSessionStore(
    (state) => state.setEditorURLCode
  );

  const onSubmit = () => {
    if (customAction) {
      customAction();
      return;
    }

    if (type === "query") {
      editQueryType(API_SAMPLES.API_SAMPLE_QUERY_PARAMS_TYPE.TYPE);
      setEditorQuerySchemaJSON(API_SAMPLES.API_SAMPLE_QUERY_PARAMS_TYPE.SCHEMA);
      setEditorQuery(API_SAMPLES.API_SAMPLE_QUERY_PARAMS_TYPE.JSON);
    } else if (type === "body") {
      editBodyType(API_SAMPLES.API_SAMPLE_REQUEST_BODY_TYPE.TYPE);
      setEditorBodyType(RecipeMutationContentType.JSON);
      setEditorBodySchemaJSON(API_SAMPLES.API_SAMPLE_REQUEST_BODY_TYPE.SCHEMA);
      setEditorBody(API_SAMPLES.API_SAMPLE_REQUEST_BODY_TYPE.JSON);
    } else if (type === "url") {
      setEditorURLSchemaType(API_SAMPLES.API_SAMPLE_URL_PARAMS_TYPE.TYPE);
      setEditorURLSchemaJSON({});
      setEditorUrlCode(API_SAMPLES.API_SAMPLE_URL_PARAMS_TYPE.JSON);
    }
  };

  const [importJSONModal, setImportJSONModal] = useState(false);

  return (
    <div className="h-full flex  justify-center items-center border-t border-recipe-slate w-full">
      <div className="flex flex-col space-y-6">
        {allowImport && (
          <button
            className="btn btn-outline opacity-30 hover:opacity-100"
            onClick={() => {
              setImportJSONModal(true);
            }}
          >
            Import JSON
          </button>
        )}
        <button
          className="btn btn-outline opacity-30 hover:opacity-100"
          onClick={onSubmit}
        >
          Initialize {type} schema
        </button>
      </div>
      {importJSONModal && (
        <JSONModalWindow
          onClose={() => {
            setImportJSONModal(false);
          }}
          type={type}
          onJSONUpdate={(json) => {
            console.log("json update", json);
            if (type === "query") {
              setEditorQuery(json);
            } else if (type === "body") {
              setEditorBody(json);
              console.log("updating");
            } else if (type === "url") {
              setEditorUrlCode(json);
            }
          }}
        />
      )}
    </div>
  );
}

function JSONModalWindow({
  onClose,
  type,
  onJSONUpdate,
}: {
  onClose: () => void;
  type: EditorParamView;
  onJSONUpdate: (json: string) => void;
}) {
  return (
    <Modal header="Import JSON" onClose={onClose}>
      <ImportJSONToTypeScript
        onboarding
        editorParamView={type}
        onClose={onClose}
        onJSONUpdate={onJSONUpdate}
      />
    </Modal>
  );
}
