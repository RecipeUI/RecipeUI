"use client";

import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { RecipeEditBodySearch } from "../../components/RecipeBody/RecipeBodySearch/RecipeEditBodySearch";
import { RecipeSidebar } from "../../components/RecipeSidebar";
import {
  DesktopPage,
  EditorSliceValues,
  GLOBAL_POLLING_FACTOR,
  RecipeBodyRoute,
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { EditorBody } from "./EditorBody";
import { EditHeaders } from "./EditHeaders";
import { RecipeOutput } from "../../components/RecipeOutput";
import { EditorAuth } from "./EditorAuth";
import { Modal } from "../../components/Modal";
import { parseCurl } from "./curlParser";
import { RecipeAuthType, RecipeMethod } from "types/enums";
import { v4 as uuidv4 } from "uuid";
import {
  API_LOCAL_PROCESSING_URLS,
  API_TYPE_NAMES,
} from "../../utils/constants/main";
import { EditorURL } from "./EditorURL";
import { useRouter } from "next/navigation";
import { EditorQuery } from "./EditorQuery";
import { useIsTauri } from "../../hooks/useIsTauri";
import { useLocalStorage } from "usehooks-ts";

const EDITOR_ROUTES = [
  RecipeBodyRoute.Body,
  RecipeBodyRoute.Query,
  RecipeBodyRoute.Headers,
  RecipeBodyRoute.Auth,
];

export default function EditorPage() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  useEffect(() => localStorage.removeItem("usehooks-ts-dark-mode"), []);

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

  const router = useRouter();
  const isTauri = useIsTauri();

  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

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
          {ForkExamples.map(({ label, description, id }) => {
            return (
              <NewRequestAction
                key={id}
                label={label}
                description={description}
                onClick={() => {
                  if (isTauri) {
                    setDesktopPage({
                      page: DesktopPage.RecipeView,
                      pageParam: id,
                    });
                  } else {
                    router.push(`/a/${id}`);
                  }
                }}
              />
            );
          })}
        </section>
      </div>
      {curlModal && <CurlModal onClose={() => setCurlModal(false)} />}
    </div>
  );
}

const ForkExamples = [
  {
    label: "OpenAI Chat Completion",
    description: "Figure out how to do generative AI with OpenAI's API.",
    id: "48f37734-bbf4-4d0e-81b4-08da77030b06",
  },
  {
    label: "Reddit API",
    description: "Search across reddit!",
    id: "183eea98-32c9-4cf6-8c03-6084147e30db",
  },
];

function CurlModal({ onClose }: { onClose: () => void }) {
  const [curlString, setCurlString] = useState("");
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onSubmit = async () => {
    setError(null);
    setLoading(true);

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
    } finally {
      setLoading(false);
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
        {loading ? (
          <span className="loading  loading-lg loading-bars"></span>
        ) : (
          <button className="btn btn-accent btn-sm" onClick={onSubmit}>
            Submit
          </button>
        )}
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

  const editorQuery = useRecipeSessionStore((state) => state.editorQuery);
  const editorBody = useRecipeSessionStore((state) => state.editorBody);
  const session = useRecipeSessionStore((state) => state.currentSession);

  const test = useRecipeSessionStore((state) => {
    const {
      editorURLSchemaJSON,
      editorURLSchemaType,
      editorQuerySchemaJSON,
      editorQuerySchemaType,
      editorBodySchemaJSON,
      editorBodySchemaType,
    } = state;

    console.log("state", {
      editorURLSchemaJSON,
      editorURLSchemaType,
      editorQuerySchemaJSON,
      editorQuerySchemaType,
      editorBodySchemaJSON,
      editorBodySchemaType,
    });

    // if (state.editorAuth && state.editorAuth.type !== RecipeAuthType.Bearer) {
    //   console.log({
    //     auth: [
    //       {
    //         type: state.editorAuth.type,
    //         payload: {
    //           name: state.editorAuth.meta,
    //         },
    //       },
    //     ],
    //     ...(state.editorAuth.docs
    //       ? {
    //           docs: {
    //             auth: state.editorAuth.docs,
    //           },
    //         }
    //       : {}),
    //   } as RecipeOptions);
    // }

    return null;
  });

  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);
  const editorURLCode = useRecipeSessionStore((state) => state.editorURLCode);
  const editorURLSchemaType = useRecipeSessionStore(
    (state) => state.editorURLSchemaType
  );

  const setEditorURLCode = useRecipeSessionStore(
    (state) => state.setEditorURLCode
  );
  const setEditorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaJSON
  );
  const setEditorURLSchemaType = useRecipeSessionStore(
    (state) => state.setEditorURLSchemaType
  );

  useEffect(() => {
    if (!editorBody || editorBody === "{}") {
      if (editorQuery) {
        setBodyRoute(RecipeBodyRoute.Query);
      } else if (editorURLSchemaType) {
        setBodyRoute(RecipeBodyRoute.URL);
      }
    }
  }, [session?.id]);

  const BODY_ROUTES = useMemo(() => {
    const hasURLParams = editorUrl.match(/{(\w+)}/g);

    if (!hasURLParams && editorURLCode) {
      setEditorURLCode("");
      setEditorURLSchemaJSON(null);
      setEditorURLSchemaType(null);
      return [...EDITOR_ROUTES];
    }

    if (hasURLParams) {
      return [...EDITOR_ROUTES, RecipeBodyRoute.URL];
    }

    // Lets also do cleanup if the person removes urlParams
    return EDITOR_ROUTES;
  }, [editorUrl]);

  return (
    <div className={classNames("flex-1 flex flex-col relative")}>
      <RecipeEditBodySearch />
      <div className="flex space-x-6 sm:p-4 sm:pt-2 pl-4 pb-4">
        {BODY_ROUTES.map((route) => {
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
        {bodyRoute === RecipeBodyRoute.URL && <EditorURL />}
        <RecipeOutput />
      </div>
    </div>
  );
}
