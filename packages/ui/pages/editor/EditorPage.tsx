"use client";

import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { RecipeEditBodySearch } from "../../components/RecipeBody/RecipeBodySearch/RecipeEditBodySearch";
import { RecipeSidebar } from "../../components/RecipeSidebar";
import {
  GLOBAL_POLLING_FACTOR,
  RecipeBodyRoute,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { EditorBody } from "./EditorBody";
import { EditHeaders } from "./EditHeaders";
import { RecipeOutput } from "../../components/RecipeOutput";
import { EditorAuth } from "./EditorAuth";
import { EditorURL } from "./EditorURL";
import { EditorQuery } from "./EditorQuery";
import { useIsTauri } from "../../hooks/useIsTauri";
import { RecipeTemplateEdit } from "../../components/RecipeBody/RecipeLeftPane/RecipeTemplateEdit";
import { useMiniRecipes } from "../../state/apiSession";
import Link from "next/link";
import { MegaphoneIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { CurlModal } from "./Builders/CurlModal";
import { ImportBuilderModal } from "./Builders/ImportBuilderModal";
import { useInitializeRecipe } from "../../hooks/useInitializeRecipe";
import {
  FreeForkExamples,
  SuggestedExamples,
} from "../../utils/constants/recipe";
import { useDarkMode } from "usehooks-ts";

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

  const { isDarkMode } = useDarkMode();
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
              {!showForkExamples && (
                <NewRequestAction
                  label="Fork from our public API collection"
                  description="Try NASA, Giphy, Reddit, Pokemon, ChatGPT and more in seconds."
                  onClick={() => {
                    setShowForkExamples(true);
                  }}
                />
              )}
              <NewRequestAction
                label="New request"
                description="Create a request from scratch."
                onClick={() => {
                  addEditorSession();
                }}
              />

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
                description="These APIs can be used right away without an API key!"
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
          <div className="">
            <a
              href="https://www.producthunt.com/posts/recipeui?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-recipeui"
              target="_blank"
              className="cursor-pointer"
            >
              <img
                src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=411024&theme=light`}
                alt="RecipeUI - Open&#0032;source&#0032;type&#0045;safe&#0032;Postman&#0032;alternative | Product Hunt"
                width="250"
                height="54"
              />
            </a>
            <a
              className={classNames(
                "border rounded-md p-4  flex justify-center items-center mt-8 cursor-pointer bg-accent text-white"
              )}
              href="https://www.producthunt.com/posts/recipeui?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-recipeui"
            >
              <MegaphoneIcon className="h-12 mb-2 text-sm  mr-2" />
              <p>
                Just launched on ProductHunt. Help us with an{" "}
                <span className="underline underline-offset-2">upvote</span>!
              </p>
            </a>
          </div>
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
                  Getting API keys from providers
                </a>
              </li>
            </ul>
          </div>

          <div
            className={classNames(
              "border rounded-md p-4  flex justify-center items-center",
              isTauri && "bg-neutral text-black border-none"
            )}
          >
            <SparklesIcon className="h-12 mb-2 text-sm  mr-2" />
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
        </section>
      </div>
      {curlModal && <CurlModal onClose={() => setCurlModal(false)} />}
      {importBuilderModal && (
        <ImportBuilderModal onClose={() => setImportBuilderModal(false)} />
      )}
    </div>
  );
}

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

  const { initializeRecipe } = useInitializeRecipe();

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
                initializeRecipe(forkedExample.id);
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
          nextBlack ? "text-black dark:text-white" : "text-blue-600"
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
