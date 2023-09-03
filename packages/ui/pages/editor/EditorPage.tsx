"use client";

import classNames from "classnames";
import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { RecipeEditBodySearch } from "../../components/RecipeBody/RecipeBodySearch/RecipeEditBodySearch";
import { RecipeSidebar } from "../../components/RecipeSidebar";
import {
  DesktopPage,
  GLOBAL_POLLING_FACTOR,
  RecipeBodyRoute,
  RecipeOutputTab,
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { EditorBody } from "./EditorBody";
import { EditHeaders } from "./EditHeaders";
import { RecipeOutput } from "../../components/RecipeOutput";
import { EditorAuth } from "./EditorAuth";
import { v4 as uuidv4 } from "uuid";
import { EditorURL } from "./EditorURL";
import { useRouter } from "next/navigation";
import { EditorQuery } from "./EditorQuery";
import { useIsTauri } from "../../hooks/useIsTauri";
import { RecipeTemplateEdit } from "../../components/RecipeBody/RecipeLeftPane/RecipeTemplateEdit";
import {
  initializeRecipeList,
  setConfigForSessionStore,
  useMiniRecipes,
  useSessionFolders,
} from "../../state/apiSession";
import Link from "next/link";
import { MegaphoneIcon, StarIcon } from "@heroicons/react/24/outline";
import { shell } from "@tauri-apps/api";
import { SupabaseContext } from "../../components/Providers/SupabaseProvider";
import { fetchHomeRecipe } from "../../fetchers/home";
import { getConfigFromRecipe } from "../../components/RecipeBody/RecipeLeftPane/RecipeForkTab";
import { DownloadContainer } from "../../components/DownloadContainer/DownloadContainer";
import { CurlModal } from "./Builders/CurlModal";
import { ImportBuilderModal } from "./Builders/ImportBuilderModal";

const EDITOR_ROUTES = [RecipeBodyRoute.Body, RecipeBodyRoute.Query];

const CONFIG_ROUTES = [RecipeBodyRoute.Headers, RecipeBodyRoute.Auth];

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
  const [importBuilderModal, setImportBuilderModal] = useState(false);

  const isTauri = useIsTauri();

  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const [showForkExamples, setShowForkExamples] = useState(false);

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
      <div className="hidden  md:gap-x-4 lg:gap-x-16 sm:flex flex-col lg:grid md:grid-cols-3 w-fit max-w-7xl sm:px-[5%] overflow-y-scroll pb-12">
        <div
          className={classNames(
            "md:col-span-2 lg:col-span-2",
            isTauri ? "col-span-3" : "col-span-2"
          )}
        >
          <section className="space-y-2 flex flex-col">
            <div>
              <h1 className="font-bold text-lg">Get started</h1>
              <p className="text-sm">
                All requests are statically typed and saved locally.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <NewRequestAction
                label="New request"
                description="Create a request from scratch."
                onClick={() => {
                  addEditorSession();
                }}
              />
              {!showForkExamples && (
                <NewRequestAction
                  label="Fork from our public API collection."
                  description="See how easy it is to fork and use an API right away!"
                  onClick={() => {
                    setShowForkExamples(true);
                  }}
                />
              )}
              {/* <NewRequestAction
                label="Import from CURL"
                onClick={() => setCurlModal(true)}
                description="Use CURL to prefill request info, TypeScript types, and JSON Schema."
              /> */}
              {/* <NewRequestAction
                label="Import builder"
                onClick={() => setImportBuilderModal(true)}
                description="Have a request body or query params? Our builder will help generate types for you."
              /> */}
            </div>
          </section>
          {showForkExamples && (
            <>
              <ForkExampleContainer
                title="Public APIs"
                description="These APIs can be used right away, without an API key!"
                examples={FreeForkExamples}
              />
              <ForkExampleContainer
                title="Popular APIs"
                description="Some of these APIs need an API key, but we've personally written a doc for each one!"
                examples={SuggestedExamples}
                showHomeLink
              />
            </>
          )}
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
      {importBuilderModal && (
        <ImportBuilderModal onClose={() => setImportBuilderModal(false)} />
      )}
    </div>
  );
}

const FreeForkExamples = [
  {
    label: "Dog API",
    description: "Pictures of really cute dogs.",
    id: "cc37a0b6-e138-4e30-8dda-7fa28d4c0f65",
    // tags: ["No Auth"],
  },
  {
    label: "Reddit API",
    description: "Search across reddit!",
    id: "183eea98-32c9-4cf6-8c03-6084147e30db",
    // tags: ["No Auth"],
  },
  {
    label: "Pokemon API",
    description: "Pokedex as an API.",
    id: "c645327c-4652-4572-aa39-35388943abf8",
    // tags: ["No Auth"],
  },
  {
    label: "JSON Placeholder API",
    description: "Popular API for testing fake data.",
    id: "6bd53e59-8994-4382-ba41-d81146003b8d",
    // tags: ["No Auth"],
  },
];

const SuggestedExamples = [
  {
    label: "OpenAI Chat Completion",
    description: "Figure out how to do generative AI with OpenAI's API.",
    id: "48f37734-bbf4-4d0e-81b4-08da77030b06",
  },
  {
    label: "NASA API",
    description: "See pictures from Mars Rover.",
    id: "a806fd1c-3325-4f07-bcdc-985f5033f80a",
    // tags: ["Free"],
  },
  {
    label: "Giphy API",
    description: "Memes as an API.",
    id: "ccfc1216-f4cc-4f64-b5c7-57bae974a4c4",
    // tags: ["Free"],
  },
  {
    label: "Unsplash API",
    description: "Gorgeous pictures for image backgrounds or covers.",
    id: "7e96b0cc-9684-4deb-8425-4f2ce98e9ae6",
    // tags: ["Free"],
  },
];

function ForkExampleContainer({
  title,
  description,
  examples,
  showHomeLink,
}: {
  title: string;
  description: string;
  examples: {
    label: string;
    description: string;
    id: string;
    tags?: string[];
  }[];
  showHomeLink?: boolean;
}) {
  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const supabase = useContext(SupabaseContext);

  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const { addSessionToFolder } = useSessionFolders();

  return (
    <section className="space-y-2 flex flex-col mt-12">
      <div>
        <h2 className="font-bold text-lg">{title}</h2>
        <p className="text-sm">
          {description}{" "}
          {showHomeLink && (
            <span>
              Visit our{" "}
              <a
                href="/?collections=true"
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
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col md:grid grid-cols-2 gap-4">
        {examples.map((forkedExample, i) => {
          return (
            <NewRequestAction
              key={forkedExample.id}
              label={forkedExample.label}
              description={forkedExample.description}
              tags={forkedExample.tags}
              onClick={async () => {
                try {
                  // get the recipe information first
                  const recipe = await fetchHomeRecipe({
                    recipeId: forkedExample.id,
                    supabase,
                  });

                  if (!recipe) {
                    throw new Error("Recipe not found");
                  }

                  const { config: sessionConfig } = getConfigFromRecipe(recipe);
                  await setConfigForSessionStore({
                    config: sessionConfig,
                    recipeId: recipe.id,
                  });

                  if (recipe.templates) {
                    await initializeRecipeList(recipe, recipe.templates);
                  }

                  const newSession: RecipeSession = {
                    id: uuidv4(),
                    name: recipe.title,
                    apiMethod: sessionConfig.editorMethod,
                    recipeId: recipe.id,
                  };
                  initializeEditorSession({
                    currentSession: newSession,
                    ...sessionConfig,
                    outputTab: RecipeOutputTab.DocTwo,
                  });

                  await addSessionToFolder(
                    newSession.id,
                    recipe.project,
                    recipe.project
                  );
                } catch (e) {
                  if (isTauri) {
                    setDesktopPage({
                      page: DesktopPage.RecipeView,
                      pageParam: forkedExample.id,
                    });
                  }
                } finally {
                }
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function NewRequestAction({
  label,
  description,
  onClick,
  tags,
  loading,
}: {
  label: string;
  description: string;
  onClick?: () => void;
  tags?: string[];
  loading?: boolean;
}) {
  return (
    <button
      className={classNames(
        "border rounded-md p-4 max-w-[xs] text-start flex flex-col"
      )}
      onClick={onClick}
    >
      {loading && <span className="loading loading-bars mb-1"></span>}
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
  const editorQuerySchemaType = useRecipeSessionStore(
    (state) => state.editorQuerySchemaType
  );
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
      // console.debug("state", {
      //   editorURLSchemaJSON,
      //   editorURLSchemaType,
      //   editorQuerySchemaJSON,
      //   editorQuerySchemaType,
      //   editorBodySchemaJSON,
      //   editorBodySchemaType,
      // });
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
    // console.log(
    //   "Change of sessionId",
    //   session?.id,
    //   editorURLSchemaType,
    //   editorQuerySchemaType
    // );
    if (!editorBody || editorBody === "{}") {
      if (editorURLSchemaType) {
        setBodyRoute(RecipeBodyRoute.URL);
      } else if (editorQuerySchemaType) {
        setBodyRoute(RecipeBodyRoute.Query);
      }
    }
  }, [session?.id]);

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

    mainRoutes.push(...CONFIG_ROUTES);

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
        {bodyRoute === RecipeBodyRoute.URL && <EditorURL />}
        {bodyRoute === RecipeBodyRoute.Headers && <EditHeaders />}
        {bodyRoute === RecipeBodyRoute.Auth && <EditorAuth />}
        {bodyRoute === RecipeBodyRoute.Templates && <RecipeTemplateEdit />}
        <RecipeOutput />
      </div>
    </div>
  );
}

export function DesktopAppUpsell({ nextBlack }: { nextBlack?: boolean }) {
  return (
    <p>
      Built on top of open source tech like{" "}
      <span className="text-orange-600 font-bold underline underline-offset-2">
        Rust
      </span>
      ,{" "}
      <span
        className={classNames(
          "font-bold underline underline-offset-2",
          nextBlack ? "text-black" : "text-blue-600"
        )}
      >
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
