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
import { RecipeTemplateEdit } from "../../components/RecipeBody/RecipeLeftPane/RecipeTemplateEdit";
import { useMiniRecipes } from "../../state/apiSession";
import Link from "next/link";
import { MegaphoneIcon, StarIcon } from "@heroicons/react/24/outline";
import { shell } from "@tauri-apps/api";

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
      className={
        "flex-1 flex flex-col relative sm:justify-center items-center py-8"
      }
    >
      {!isTauri && (
        <div className="bg-accent sm:hidden p-4 self-start">
          <p>
            Our web editor is not mobile friendly. Please visit our home page
            and play around with other examples!
          </p>
          <Link className="btn btn-neutral mt-4" href="/">
            Go Home
          </Link>
        </div>
      )}
      <div className="hidden  md:gap-x-4 lg:gap-x-16 sm:flex flex-col lg:grid md:grid-cols-3 w-fit max-w-7xl sm:px-[5%]">
        <div
          className={classNames(
            "md:col-span-2 lg:col-span-2",
            isTauri ? "col-span-3" : "col-span-2"
          )}
        >
          <section className="space-y-2 flex flex-col">
            <div>
              <h1 className="font-bold text-lg">New Request</h1>
              <p className="text-sm">
                See how fun creating statically-typed API requests are!
              </p>
            </div>
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
          <section className="space-y-2 flex flex-col mt-12">
            <div>
              <h2 className="font-bold text-lg">Fork Popular Examples</h2>
              <p className="text-sm">
                Visit our{" "}
                <a
                  href="/"
                  className="underline underline-offset-2"
                  onClick={(e) => {
                    if (isTauri) {
                      e.preventDefault();
                      setDesktopPage(null);
                    }
                  }}
                >
                  home page
                </a>{" "}
                to see our collections.
              </p>
            </div>
            <div className="sm:flex flex-col lg:grid grid-cols-2 gap-4">
              {ForkExamples.map(({ label, description, id, tags }) => {
                return (
                  <NewRequestAction
                    key={id}
                    label={label}
                    description={description}
                    tags={tags}
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
            </div>
          </section>
        </div>
        <section className="col-span-1 h-fit space-y-8 sm:mt-8 lg:mt-0">
          {!isTauri && (
            <div className="bg-neutral p-4 rounded-md text-white">
              <p className="my-2 sm:text-base text-lg">
                Download our
                <span className="font-bold italic">
                  {" blazingly fast and lightweight (<20mb)"}
                </span>{" "}
                desktop app.
              </p>
              <DesktopAppUpsell />
              <Link className="btn btn-accent btn-sm mt-4" href="/download">
                Download
              </Link>
            </div>
          )}
          <div
            className={classNames(
              "border rounded-md p-4  flex justify-center items-center",
              isTauri && "bg-accent text-black border-none"
            )}
          >
            <MegaphoneIcon className="h-12 mb-2 text-sm  mr-2" />
            <p>
              {"Have feedback? We'd love to hear it over "}
              <a
                href="https://forms.gle/HaLedasspBZkVLsy7"
                target="_blank"
                className="underline underline-offset-2"
              >
                here
              </a>
              .
            </p>
          </div>
          <div className="border rounded-md p-4">
            <p>Helpful links</p>
            <ul className="text-sm mt-2 list-disc ml-6 space-y-1">
              <li>
                <a
                  href="https://github.com/RecipeUI/RecipeUI"
                  target="_blank"
                  className="underline underline-offset-2 cursor-pointer"
                  // onClick={(e) => {
                  // if (isTauri) {
                  //   e.preventDefault();
                  //   shell.open("https://discord.gg/rXmpYmCNNA");
                  // }
                  // }}
                >
                  Star us on GitHub
                </a>
              </li>
              {isTauri && (
                <li>
                  <button
                    className="underline underline-offset-2 cursor-pointer"
                    onClick={(e) => {
                      setDesktopPage(null);
                    }}
                  >
                    Public collections
                  </button>
                </li>
              )}
              <li>
                <a
                  href="https://discord.gg/rXmpYmCNNA"
                  target="_blank"
                  className="underline underline-offset-2 cursor-pointer"
                  // onClick={(e) => {
                  // if (isTauri) {
                  //   e.preventDefault();
                  //   shell.open("https://discord.gg/rXmpYmCNNA");
                  // }
                  // }}
                >
                  Discord Community
                </a>
              </li>
              <li>
                <a
                  href="https://docs.recipeui.com/"
                  target="_blank"
                  className="underline underline-offset-2 cursor-pointer"
                >
                  Getting API keys from providers.
                </a>
              </li>
            </ul>
          </div>
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
    tags: ["No Auth"],
  },
  {
    label: "Dog API",
    description: "Pictures of really cute dogs.",
    id: "cc37a0b6-e138-4e30-8dda-7fa28d4c0f65",
    tags: ["No Auth"],
  },
  {
    label: "NASA API",
    description: "See pictures from Mars Rover.",
    id: "a806fd1c-3325-4f07-bcdc-985f5033f80a",
    tags: ["Free"],
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
  tags,
}: {
  label: string;
  description: string;
  onClick?: () => void;
  tags?: string[];
}) {
  return (
    <button
      className="border rounded-md p-4 max-w-[xs] text-start flex flex-col"
      onClick={onClick}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="text-xs">{description}</p>
      {tags && (
        <div>
          {tags.map((tag) => (
            <div className="badge badge-accent badge-sm" key={tag}>
              {tag}
            </div>
          ))}
        </div>
      )}
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

    if (process.env.NEXT_PUBLIC_ENV === "dev") {
      console.log("state", {
        editorURLSchemaJSON,
        editorURLSchemaType,
        editorQuerySchemaJSON,
        editorQuerySchemaType,
        editorBodySchemaJSON,
        editorBodySchemaType,
      });
    }

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

  const { recipes } = useMiniRecipes(session?.recipeId);
  useEffect(() => {
    if (!editorBody || editorBody === "{}") {
      if (editorURLSchemaType) {
        setBodyRoute(RecipeBodyRoute.URL);
      } else if (editorQuery) {
        setBodyRoute(RecipeBodyRoute.Query);
      }
    }
  }, [session?.id]);

  console.log("", recipes);

  const BODY_ROUTES = useMemo(() => {
    const hasURLParams = editorUrl.match(/{(\w+)}/g);
    const mainRoutes = [...EDITOR_ROUTES];

    if (!hasURLParams && editorURLCode) {
      setEditorURLCode("");
      setEditorURLSchemaJSON(null);
      setEditorURLSchemaType(null);
    }

    if (hasURLParams) {
      mainRoutes.push(RecipeBodyRoute.URL);
    }

    if (recipes.length > 0) {
      mainRoutes.push(RecipeBodyRoute.Templates);
    }

    // Lets also do cleanup if the person removes urlParams
    return mainRoutes;
  }, [editorUrl, recipes.length]);

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
        {bodyRoute === RecipeBodyRoute.Templates && <RecipeTemplateEdit />}
        <RecipeOutput />
      </div>
    </div>
  );
}

export function DesktopAppUpsell() {
  return (
    <p>
      Built on top of open source tech like{" "}
      <span className="text-orange-600 font-bold underline underline-offset-2">
        Rust
      </span>
      ,{" "}
      <span className="text-blue-600 font-bold underline underline-offset-2">
        NextJS
      </span>
      , and{" "}
      <span className="text-accent font-bold underline underline-offset-2">
        Supabase
      </span>
      , RecipeUI has the most modern tech stack for a cross-platform desktop and
      browser API tool.
    </p>
  );
}