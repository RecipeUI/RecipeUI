"use client";

import MonacoEditor from "@monaco-editor/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDarkMode, useDebounce } from "usehooks-ts";
import {
  DARKTHEME_SETTINGS,
  DEFAULT_MONACO_OPTIONS,
  EditorParamView,
  LIGHTTHEME_SETTINGS,
} from "./common";
import {
  AutoSaveError,
  InitializeSchema,
  handleEditorWillMount,
} from "./EditorJSON";

import {
  fetchJSONFromTypeScript,
  superFetchTypesAndJSON,
} from "../../../../ui/fetchers/editor";
import { JSONSchema6 } from "json-schema";
import classNames from "classnames";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { EditorActionWrapper } from "./EditorAction";
import { Modal } from "../../../components/Modal";
import { useRecipeSessionStore } from "../../../state/recipeSession";
import { parse } from "json5";
import { getQueryAndBodyInfo } from "../Builders/helpers";
import { API_TYPE_NAMES } from "../../../utils/constants/recipe";
import { commentAllLines } from "../../../utils/main";
import ReactCodeMirror, { basicSetup } from "@uiw/react-codemirror";
import { json as jsonModule, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter } from "@codemirror/lint";

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

  function refresh() {
    setPreparingChange(true);
  }

  useEffect(() => {
    if (!preparingChange) return;

    if (!latestTypeValue) {
      setSchemaJSON(null);
      setPreparingChange(false);
      return;
    }

    setRefreshing(true);

    // We have to migrate off of here eventually
    // Will mod this package so that it doesn't need a server
    async function refreshJSON(latestTypeValue: string) {
      try {
        const value = await fetchJSONFromTypeScript({ types: latestTypeValue });

        setSchemaJSON(value);
      } catch (e) {
        console.error(e);
        setHasError(true);
        setTimeout(() => {
          setHasError(false);
        }, 3000);
      } finally {
        setRefreshing(false);
        setPreparingChange(false);
      }
    }

    refreshJSON(latestTypeValue);
  }, [changesFinalized, preparingChange]);

  return {
    changesFinalized,
    preparingChange,
    hasError,
    refreshing,
    refresh,
  };
}

interface EditorTypeScriptProps {
  sessionId?: string;
  editorParamView: EditorParamView;
  schemaType: string | null;
  defaultExport?: string | null;

  setSchemaType: (value: string | null) => void;
  setSchemaJSON: (value: JSONSchema6 | null) => void;
}

export const EditorTypeScript = (props: EditorTypeScriptProps) => {
  const [settingsModal, setSettingsModal] = useState(false);
  return (
    <div className="relative flex border-t border-recipe-slate w-full ">
      <EditorActionWrapper
        label={"TypeScript"}
        hideAction={!props.schemaType}
        onClick={() => {
          setSettingsModal(!settingsModal);
        }}
      >
        <EditorTypeScriptInner {...props} />
      </EditorActionWrapper>

      {settingsModal && (
        <TypeScriptSettingsModal
          onClose={() => {
            setSettingsModal(false);
          }}
          editorParamView={props.editorParamView}
        />
      )}
    </div>
  );
};

const EditorTypeScriptInner = ({
  editorParamView,
  schemaType,
  defaultExport,
  sessionId,

  setSchemaType,
  setSchemaJSON,
}: EditorTypeScriptProps) => {
  const { isDarkMode } = useDarkMode();

  const { preparingChange, refreshing, hasError, changesFinalized, refresh } =
    useDebouncedEditorChanges({
      latestTypeValue: schemaType,
      setSchemaJSON: setSchemaJSON,
    });

  useEffect(() => {
    // This is a hack to make sure refreshing one tab, won't accidentally refresh another tab after switching quickly.
    let timer = setTimeout(() => {
      refresh();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (schemaType == undefined) {
    return <InitializeSchema type={editorParamView} />;
  }

  return (
    <div className="relative flex-1 w-full">
      <MonacoEditor
        className="pt-2"
        language="typescript"
        theme={isDarkMode ? DARKTHEME_SETTINGS.name : LIGHTTHEME_SETTINGS.name}
        value={schemaType}
        onChange={(newCode) => {
          setSchemaType(newCode || "");
        }}
        onMount={(editor, monaco) => {
          // This seems to disable the JSON formatter
          // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          //   editor.getAction("editor.action.formatDocument")?.run();
          // });
        }}
        beforeMount={handleEditorWillMount}
        options={DEFAULT_MONACO_OPTIONS}
      />
      <AutoSaveError
        hasChanged={preparingChange}
        hasError={hasError}
        refreshing={refreshing}
      />
      {!refreshing &&
        !preparingChange &&
        defaultExport &&
        !schemaType?.includes(defaultExport) && (
          <LintIfMissing defaultExport={defaultExport} />
        )}
    </div>
  );
};

function LintIfMissing({ defaultExport }: { defaultExport: string }) {
  return (
    <div
      className={classNames("absolute top-3 right-8", "btn btn-sm btn-error")}
    >
      <div
        className="tooltip tooltip-left normal-case"
        data-tip={`Missing "export interface ${defaultExport} { ... }"`}
      >
        <ExclamationCircleIcon className="w-6 h-6" />
      </div>
    </div>
  );
}

enum SettingsMode {
  Import = "import",
  Disable = "disable",
}

function TypeScriptSettingsModal({
  onClose,
  editorParamView,
}: {
  onClose: () => void;
  editorParamView: EditorParamView;
}) {
  const [mode, setMode] = useState<SettingsMode>(SettingsMode.Import);
  return (
    <Modal header="TypeScript Settings" onClose={onClose}>
      <p>Perform an action below</p>
      <select
        className="select select-bordered mt-2"
        value={mode}
        onChange={(e) => {
          setMode(e.target.value as SettingsMode);
        }}
      >
        <option value={SettingsMode.Import}>Import from JSON</option>
        <option value={SettingsMode.Disable}>Disable TypeScript</option>
      </select>
      <div className="divider" />
      {mode === SettingsMode.Import && (
        <ImportJSONToTypeScript
          editorParamView={editorParamView}
          onClose={onClose}
        />
      )}
      {mode === SettingsMode.Disable && (
        <DisableTypeScript
          editorParamView={editorParamView}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

interface ModalBodyProps {
  editorParamView: EditorParamView;
  onClose: () => void;
}
function DisableTypeScript({ editorParamView, onClose }: ModalBodyProps) {
  const { schemaTypes, setSchemaType, apiType } =
    useSchemaJSON(editorParamView);

  return (
    <div>
      <p>Are you sure you want to disable TypeScript?</p>
      <button
        className="btn btn-error btn-sm mt-2"
        onClick={() => {
          const newType = `
export interface ${apiType} {
  [key: string]: any;
};
          `.trim();

          setSchemaType(
            schemaTypes
              ? `${newType}\n\n${commentAllLines(schemaTypes)}`
              : newType
          );
          onClose();
        }}
      >
        Disable
      </button>
    </div>
  );
}

function useSchemaJSON(editorParamView: EditorParamView) {
  const editorURLJSON = useRecipeSessionStore((state) => state.editorURLCode);
  const editorQueryJSON = useRecipeSessionStore((state) => state.editorQuery);
  const editorBodyJSON = useRecipeSessionStore((state) => state.editorBody);
  const editorURLSchemaType = useRecipeSessionStore(
    (state) => state.editorURLSchemaType
  );
  const editorQuerySchemaType = useRecipeSessionStore(
    (state) => state.editorQuerySchemaType
  );
  const editorBodySchemaType = useRecipeSessionStore(
    (state) => state.editorBodySchemaType
  );

  const setEditorURLSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );
  const setEditorQuerySchemaType = useRecipeSessionStore(
    (state) => state.setEditorQuerySchemaType
  );
  const setEditorBodySchemaType = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaType
  );

  return useMemo(() => {
    let schemaJSON = editorBodyJSON;
    let setSchemaType = setEditorBodySchemaType;
    let schemaTypes = editorBodySchemaType;
    let apiType = API_TYPE_NAMES.APIRequestParams;

    if (editorParamView === EditorParamView.Url) {
      schemaJSON = editorURLJSON;
      schemaTypes = editorURLSchemaType;
      setSchemaType = setEditorURLSchemaType;
      apiType = API_TYPE_NAMES.APIUrlParams;
    } else if (editorParamView === EditorParamView.Query) {
      schemaJSON = editorQueryJSON;
      schemaTypes = editorQuerySchemaType;
      setSchemaType = setEditorQuerySchemaType;
      apiType = API_TYPE_NAMES.APIQueryParams;
    }

    return {
      schemaJSON,
      setSchemaType,
      schemaTypes,
      apiType,
    };
  }, [
    editorBodyJSON,
    editorBodySchemaType,
    editorParamView,
    editorQueryJSON,
    editorQuerySchemaType,
    editorURLJSON,
    editorURLSchemaType,
    setEditorBodySchemaType,
    setEditorQuerySchemaType,
    setEditorURLSchemaType,
  ]);
}

export function ImportJSONToTypeScript({
  editorParamView,
  onClose,
  onboarding,
  onJSONUpdate,
}: ModalBodyProps & {
  onboarding?: boolean;
  onJSONUpdate?: (json: string) => void;
}) {
  const { schemaJSON, setSchemaType } = useSchemaJSON(editorParamView);

  const [json, setJson] = useState(() => {
    try {
      const newString = JSON.stringify(parse(schemaJSON), null, 2);
      return newString;
    } catch (e) {
      console.debug(e);
      return "{}";
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onboardingDescription = !onboarding
    ? "Import from JSON? This will update your TypeScript to match the JSON you paste inside here."
    : "Paste a JSON body and we will import the JSON and the TypeScript together.";

  const isDarkMode = useDarkMode().isDarkMode;

  return (
    <div>
      <p>{onboardingDescription}</p>

      <ReactCodeMirror
        value={json}
        height="300px"
        className="h-full !outline-none border-none max-w-sm sm:max-w-none my-6"
        theme={isDarkMode ? "dark" : "light"}
        extensions={[jsonModule(), linter(jsonParseLinter()), lintGutter()]}
        onChange={(value) => {
          setJson(value);
        }}
      />

      {error && (
        <div className="text-error mb-4">
          <p>{error}</p>
        </div>
      )}
      <button
        className="btn btn-accent btn-sm"
        onClick={async (e) => {
          e.preventDefault();
          setLoading(true);

          async function _submit() {
            // First lets check if we have a valid JSON
            let parsed: Record<string, any>;
            setError(null);

            try {
              parsed = parse(json);
            } catch (e) {
              console.debug(e);
              if ((e as Error).message) {
                setError((e as Error).message);
              } else {
                setError("Invalid JSON");
              }

              throw e;
            }

            let apiType = API_TYPE_NAMES.APIRequestParams;
            if (editorParamView === EditorParamView.Url) {
              apiType = API_TYPE_NAMES.APIUrlParams;
            } else if (editorParamView === EditorParamView.Query) {
              apiType = API_TYPE_NAMES.APIQueryParams;
            }

            const bodyInfo = await superFetchTypesAndJSON({
              record: parsed,
              typeName: apiType,
            });

            setSchemaType(bodyInfo.ts);
            onJSONUpdate?.(JSON.stringify(parsed, null, 2));
          }
          try {
            await _submit();
            onClose();
          } catch (e) {
            console.debug(e);

            if ((e as Error).message) {
              setError((e as Error).message);
            } else {
              setError(
                "Unable to process types. Check the dev tool inspector for debug logs."
              );
            }
            setLoading(false);
          }
        }}
      >
        {loading ? (
          <span className="loading loading-infinity"></span>
        ) : (
          "Submit"
        )}
      </button>
    </div>
  );
}
