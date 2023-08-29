"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import { RecipeEditBodySearch } from "ui/components/RecipeBody/RecipeBodySearch/RecipeEditBodySearch";
import { RecipeSidebar } from "ui/components/RecipeSidebar";
import {
  EditorSliceValues,
  GLOBAL_POLLING_FACTOR,
  RecipeBodyRoute,
  RecipeSession,
  useRecipeSessionStore,
} from "ui/state/recipeSession";
import { EditorBody } from "./EditorBody";
import { EditHeaders } from "./EditHeaders";
import { EditorQuery } from "@/app/editor/EditorQuery";
import { RecipeOutput } from "ui/components/RecipeOutput";
import { Loading } from "ui/components/Loading";
import { EditorAuth } from "@/app/editor/EditorAuth";
import { Modal } from "ui/components/Modal";
import { CurlRequestInfo, parseCurl } from "@/app/editor/curlParser";
import { RecipeAuthType, RecipeMethod } from "types/enums";
import { v4 as uuidv4 } from "uuid";
import {
  API_LOCAL_PROCESSING_URLS,
  API_TYPE_NAMES,
} from "ui/utils/constants/main";

const EDITOR_ROUTES = [
  RecipeBodyRoute.Body,
  RecipeBodyRoute.Query,
  RecipeBodyRoute.Headers,
  RecipeBodyRoute.Auth,
];

function EditorPage() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div className="flex h-full">
      <RecipeSidebar />
      {currentSession ? <CoreEditor /> : <NewRequest />}
    </div>
  );
}

function NewRequest() {
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  const [curlModal, setCurlModal] = useState(false);

  return (
    <div
      className={"flex-1 flex flex-col relative justify-center items-center"}
    >
      <div className="space-y-6 min-w-[600px]">
        <section className="space-y-2 flex flex-col">
          <h1 className="font-bold text-lg">New Request Templates</h1>
          <NewRequestAction
            label="Start from scratch"
            description="No configuration setup."
            onClick={() => {
              addEditorSession();
            }}
          />
          <NewRequestAction
            label="Import from CURL"
            onClick={() => setCurlModal(true)}
            description="Use CURL to prefill request info, TypeScript types, and JSON Schema."
          />
        </section>

        <section className="space-y-2 flex flex-col">
          <h2 className="font-bold text-lg">Fork Popular Examples</h2>
          <NewRequestAction
            label="OpenAI Chat Completion"
            description="Figure out how to do generative AI with OpenAI's API."
          />
          <NewRequestAction
            label="Pokemon API"
            description="Lightweight, fun, and no Auth needed."
          />
        </section>
      </div>
      {curlModal && <CurlModal onClose={() => setCurlModal(false)} />}
    </div>
  );
}

function CurlModal({ onClose }: { onClose: () => void }) {
  const [curlString, setCurlString] = useState("");
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  const [error, setError] = useState<string | null>(null);
  const onSubmit = async () => {
    setError(null);

    try {
      const requestInfo = parseCurl(curlString);
      const editorSlice: Partial<EditorSliceValues> = {
        editorUrl: requestInfo.url,
        editorBody: requestInfo.body
          ? JSON.stringify(requestInfo.body, null, 2)
          : "",
        editorHeaders: Object.keys(requestInfo.headers).map((key) => ({
          name: key,
          value: requestInfo.headers[key],
        })),
        editorMethod: requestInfo.method.toUpperCase() as RecipeMethod,
      };

      if (requestInfo.body) {
        const schemaTypeRes = await fetch(
          API_LOCAL_PROCESSING_URLS.JSON_TO_TS,
          {
            body: JSON.stringify({
              body: requestInfo.body,
              name: API_TYPE_NAMES.APIRequestParams,
            }),
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const schemaType = await schemaTypeRes.json();
        editorSlice.editorBodySchemaType = schemaType.join("\n");
        editorSlice.editorMethod = RecipeMethod.POST;
      }

      if (editorSlice.editorHeaders) {
        for (const header of editorSlice.editorHeaders) {
          if (header.name === "Authorization") {
            if (header.value.startsWith("Bearer")) {
              editorSlice.editorAuth = {
                type: RecipeAuthType.Bearer,
              };

              break;
            }
          }
        }

        if (editorSlice.editorAuth) {
          editorSlice.editorHeaders = editorSlice.editorHeaders.filter(
            (header) => header.name !== "Authorization"
          );
        }
      }

      const newSession: RecipeSession = addEditorSession({
        id: uuidv4(),
        name: "New Session",
        apiMethod: editorSlice.editorMethod || RecipeMethod.GET,
        recipeId: uuidv4(),
      });

      setTimeout(() => {
        initializeEditorSession({
          currentSession: newSession,
          ...editorSlice,
        });
        onClose();
      }, 0);
    } catch (err) {
      setError("Could not parse CURL");
    }
  };

  return (
    <Modal onClose={onClose} header="Import from CURL">
      <div className="mt-2 space-y-4">
        <p>{"Enter your cURL code snippet below and we'll try to parse it."}</p>
        {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
        <textarea
          rows={8}
          className={classNames(
            "textarea  w-full",
            error ? "textarea-error" : "textarea-accent"
          )}
          value={curlString}
          onChange={(e) => setCurlString(e.target.value)}
        />
        <button className="btn btn-accent btn-sm" onClick={onSubmit}>
          Submit
        </button>
      </div>
    </Modal>
  );
}
function NewRequestAction({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="border rounded-md p-4 max-w-[xs] text-start"
      onClick={onClick}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs">{description}</p>
    </button>
  );
}

function CoreEditor() {
  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const saveSession = useRecipeSessionStore((state) => state.saveEditorSession);
  useEffect(() => {
    const interval = setInterval(() => {
      saveSession();
    }, GLOBAL_POLLING_FACTOR);

    return () => {
      clearInterval(interval);
    };
  }, [saveSession]);

  // const test = useRecipeSessionStore((state) => {
  //   console.log("test", state);
  //   return null;
  // });
  return (
    <div className={classNames("flex-1 flex flex-col relative")}>
      <RecipeEditBodySearch />
      <div className="flex space-x-6 sm:p-4 sm:pt-2 pl-4 pb-4">
        {EDITOR_ROUTES.map((route) => {
          return (
            <div
              key={route}
              className={classNames(
                "font-bold text-sm",
                bodyRoute === route && "underline underline-offset-4",
                "cursor-pointer"
              )}
              onClick={() => setBodyRoute(route)}
            >
              {route}
            </div>
          );
        })}
      </div>

      <div className="flex-1 border-t border-t-slate-200 dark:border-t-slate-600  sm:flex-row flex flex-col overflow-auto">
        {bodyRoute === RecipeBodyRoute.Body && <EditorBody />}
        {bodyRoute === RecipeBodyRoute.Query && <EditorQuery />}
        {bodyRoute === RecipeBodyRoute.Headers && <EditHeaders />}
        {bodyRoute === RecipeBodyRoute.Auth && <EditorAuth />}
        <RecipeOutput />
      </div>
    </div>
  );
}

export default EditorPage;
