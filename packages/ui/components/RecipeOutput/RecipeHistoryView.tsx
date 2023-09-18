import {
  RecipeContext,
  RecipeOutputTab,
  RecipeRequestInfo,
  SessionOutput,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import CodeMirror, { BasicSetupOptions } from "@uiw/react-codemirror";
import { useDarkMode } from "usehooks-ts";
import { useContext, useEffect, useState } from "react";
import { Recipe, RecipeTemplateFragment, RequestHeader } from "types/database";
import { ProjectScope, RecipeParamType } from "types/enums";
import { OutputAPI, useOutput } from "../../state/apiSession/OutputAPI";
import { JSONSchema6 } from "json-schema";
import { ResponseInfo } from "./RecipeOutputConsole";
import { formatRelative, min, subDays } from "date-fns";

import { v4 as uuidv4 } from "uuid";
import { RecipeSendModal } from "../RecipeBody/RecipeLeftPane/RecipeTemplateEdit";
const codeMirrorSetup: BasicSetupOptions = {
  lineNumbers: true,
  highlightActiveLine: false,
  dropCursor: false,
};

enum CodeView {
  CURL = "cURL",
  JavaScriptFetch = "JavaScript - Fetch",
  JavaScriptAxios = "JavaScript - Axios",
  PythonHttpClient = "Python - http.client",
  PythonRequestLib = "Python - requests",
}
const CodeViews = Object.values(CodeView);

interface MiniRecipeToRestore {
  miniRecipe: RecipeTemplateFragment;
  output: SessionOutput;
  action: "save" | "preview";
}

export function RecipeHistoryView() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const { allOutputs } = useOutput(currentSession?.id);

  const editorURL = useRecipeSessionStore((state) => state.editorUrl);

  const [miniRecipeToRestore, setMiniRecipeToRestore] =
    useState<MiniRecipeToRestore>();

  const setOutputTab = useRecipeSessionStore((state) => state.setOutputTab);

  return (
    <div className="sm:absolute inset-0 px-4 py-8 overflow-y-auto right-pane-bg">
      <div className="flex items-center mb-4 space-x-2">
        <h1 className="text-xl font-bold  text-black dark:text-white">
          History
        </h1>
        <button
          className="btn btn-outline btn-xs"
          onClick={async () => {
            const confirm = await window.confirm(
              "Are you sure you want to clear the history?"
            );

            if (confirm) {
              OutputAPI.clearOutput(currentSession?.id!).then(() => {
                setOutputTab(RecipeOutputTab.DocTwo);
              });
            }
          }}
        >
          Clear
        </button>
      </div>
      <div className="space-y-4 flex flex-col">
        {allOutputs.map((output, i) => {
          if (!output.created_at || !output.responseInfo) return null;

          const relativeDateInfo = formatRelative(
            new Date(output.created_at),
            new Date()
          );
          return (
            <div key={i} className="border rounded-md p-4 flex flex-col">
              <div className="flex space-x-2 items-center">
                <div className="text-sm uppercase">{relativeDateInfo}</div>
                <ResponseInfo responseInfo={output.responseInfo} />
              </div>
              {output.requestInfo && output.id && (
                <HistoryActions
                  output={output}
                  editorURL={editorURL}
                  requestInfo={output.requestInfo}
                  recipeId={currentSession?.recipeId || ""}
                  createdAt={new Date(output.created_at)}
                  setMiniRecipeToRestore={setMiniRecipeToRestore}
                />
              )}
            </div>
          );
        })}
      </div>
      {miniRecipeToRestore && (
        <RecipeSendModal
          action={miniRecipeToRestore.action}
          miniRecipe={miniRecipeToRestore.miniRecipe}
          sessionOutput={miniRecipeToRestore.output}
          onClose={() => {
            setMiniRecipeToRestore(undefined);
          }}
        />
      )}
    </div>
  );
}

function HistoryActions({
  output,
  requestInfo,
  editorURL,
  setMiniRecipeToRestore,
  createdAt,
  recipeId,
}: {
  output: SessionOutput;
  requestInfo: NonNullable<SessionOutput["requestInfo"]>;
  editorURL: string;
  createdAt: Date;
  setMiniRecipeToRestore: (miniRecipe: MiniRecipeToRestore) => void;
  recipeId: string;
}) {
  const onSubmit = (action: "save" | "preview") => {
    requestInfo.payload.headers = requestInfo.payload.headers || {};
    const url = new URL(requestInfo.url);

    const editorQuery: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      editorQuery[key] = value;
    });

    const editorBody = requestInfo.payload.body;

    const editorHeaders: RequestHeader[] = [];
    for (const [headerName, headerValue] of Object.entries(
      requestInfo.payload.headers
    )) {
      editorHeaders.push({
        name: headerName,
        value: headerValue,
      });
    }

    const urlParams: Record<string, string> = {};

    let urlPaths = requestInfo.url.split("?")[0].split("/");
    let recipeURLPaths = editorURL.split("?")[0].split("/");

    recipeURLPaths.forEach((path, i) => {
      let match = path.match(/{(\w+)}/g);
      if (match && match[0]) {
        // This needs to be a more exclusive split
        const valueMatch = urlPaths[i].match(/^[^.|]*/);
        urlPaths[i].split(".")[0];

        urlParams[match[0]] = valueMatch ? valueMatch[0] : urlPaths[i];
      }
    });

    // This one is a bit tricker, but maybe we can infer from the URL placement

    const miniRecipe: RecipeTemplateFragment = {
      title: createdAt.toLocaleString(),
      description: `Restore a recipe from ${createdAt.toLocaleString()}`,

      created_at: new Date().toISOString(),
      id: uuidv4(),
      replay: {
        duration: output.duration ? output.duration : 3000,
        output: output.output,
        streaming: false,
      },
      project_scope: ProjectScope.Personal,

      queryParams: Object.keys(editorQuery).length > 0 ? editorQuery : null,
      requestBody: (editorBody as Record<string, unknown>) || null,
      urlParams: Object.keys(urlParams).length > 0 ? urlParams : null,

      recipe_id: recipeId,

      headers: editorHeaders,

      // Unnecessary
      original_author_id: null,
    };

    setMiniRecipeToRestore({
      miniRecipe,
      output,
      action,
    });
  };
  return (
    <div className="flex mt-2 space-x-2">
      <button
        className="btn w-fit btn-xs btn-neutral hover:btn-secondary hover:animate-pulse"
        onClick={() => {
          onSubmit("preview");
        }}
      >
        View
      </button>
      <button
        className="btn w-fit btn-xs btn-neutral hover:btn-secondary hover:animate-pulse"
        onClick={() => {
          onSubmit("save");
        }}
      >
        Save as Recipe
      </button>
    </div>
  );
}
