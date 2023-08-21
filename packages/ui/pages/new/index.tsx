"use client";

import { processYamlSpec } from "openapi-parser-js";
import { ChangeEvent, SetStateAction, useEffect, useState } from "react";
import yaml from "js-yaml";
import { AuthConfig, Database, Recipe, RecipeProject } from "types/database";
import classNames from "classnames";
import { uploadAPIs } from "./actions";
import { AuthFormType, ProjectScope, QueryKey } from "types/enums";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RouteTypeLabel } from "../../components/RouteTypeLabel";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { useIsTauri } from "../../hooks/useIsTauri";
import { useSupabaseClient } from "../../components/Providers/SupabaseProvider";

enum ImportStage {
  Upload,
  Select,
  Auth,
  Project,
  Submit,
}

export default function NewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [recipes, setRecipes] = useState<Omit<Recipe, "id">[]>([]);
  const [selectedRecipesRecord, setSelectedRecipesRecord] = useState<
    Record<string, boolean>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const [finishedStages, setFinishedStages] = useState<Set<ImportStage>>(
    new Set()
  );

  const user = useRecipeSessionStore((state) => state.user);
  const supabase = useSupabaseClient();
  const [selectedProject, setSelectedProject] = useState<null | string>(null);

  const projectRes = useQuery({
    queryKey: [QueryKey.Projects, user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) {
        return [];
      }

      const _projects: RecipeProject[] =
        (
          await supabase
            .from("project")
            .select("*")
            .neq("scope", ProjectScope.Global)
        ).data || [];

      if (_projects.length > 0) {
        setSelectedProject(_projects[0].project);
      }

      return _projects;
    },
  });

  const projects = projectRes.data || [];

  const numOfSelectedRecipes = Object.values(selectedRecipesRecord).filter(
    (v) => v
  ).length;
  const allSelected = numOfSelectedRecipes === recipes.length;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  useEffect(() => {
    async function loadFile(_file: File) {
      try {
        const fileInfo = await _file.text();
        let parsedYaml = yaml.load(fileInfo);

        // We'll need strong typing here eventually in case the user gives an OpenAPI spec. But it's not needed for V1 as DB will just not allow it to be uploaded.
        const recipes = processYamlSpec(
          parsedYaml as Record<string, unknown>,
          "OpenAI",
          "1"
        ) as Recipe[];

        setRecipes(recipes || []);

        if (recipes.length > 0) {
          setFinishedStages((prev) => {
            return new Set(prev).add(ImportStage.Select);
          });
        } else {
          throw new Error("No recipes found in file.");
        }
      } catch (e) {
        alert(
          "Unable to parse file or could not find recipes. Please try again."
        );
        console.error(e);
      }
    }

    if (file) {
      loadFile(file);
    }
  }, [file]);

  const [authType, setAuthType] = useState<AuthFormType>(AuthFormType.Bearer);
  const [authConfigs, setAuthConfigs] = useState<AuthConfig["payload"][]>([]);
  const [queryParamKey, setQueryParamKey] = useState("api_key");
  const [authDocs, setAuthDocs] = useState("");
  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  const onSubmit = async () => {
    const confirmation = await window.confirm(
      "Are you sure you want to upload these APIs?"
    );

    if (!confirmation) {
      setSubmitting(false);
      return;
    }

    const selectedRecipes = recipes.filter(
      (recipe) => selectedRecipesRecord[recipe.path + recipe.method]
    );

    try {
      const projectName = uploadAPIs(
        {
          apis: selectedRecipes,
          authType: authType,
          authConfigs: authConfigs,
          project: selectedProject,
          username: user?.username!,
          authDocs,
        },
        supabase
      ).then((res) => {
        if (typeof res === "string") {
          setTimeout(() => {
            if (isTauri) {
              setDesktopPage({
                page: DesktopPage.Project,
                pageParam: res,
              });
            } else {
              router.push(`/${res}`);
            }
          }, 2000);
        } else {
          alert("Something went wrong. Please try again.");
        }
      });
    } catch (e) {
      console.error(e);
    }

    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="p-12 space-y-12">
        <h1 className="text-3xl font-bold dark:text-gray-100">
          Please login to upload APIs.
        </h1>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold dark:text-gray-100">Import APIs</h1>
        <p>
          {
            "Let's start with importing an OpenAPI yaml spec. If you want us to the entire setup for you, please email team@recipeui.com."
          }
        </p>
        <div className="flex flex-col">
          <input
            type="file"
            className="file-input w-full max-w-xs mt-2"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {recipes.length > 0 && (
        <>
          <div>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold dark:text-gray-100">
                Select APIs to import{" "}
              </h1>
              <button
                className="btn btn-accent btn-sm"
                onClick={() => {
                  if (allSelected) {
                    setSelectedRecipesRecord({});
                  } else {
                    setSelectedRecipesRecord(
                      recipes.reduce(
                        (acc: typeof selectedRecipesRecord, recipe) => {
                          acc[recipe.path + recipe.method] = true;
                          return acc;
                        },
                        {}
                      )
                    );
                  }
                }}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <p className="mt-2">
              Make sure to select the ones you want to keep.{" "}
              <span className="font-bold">
                {numOfSelectedRecipes} out of {recipes.length} recipes selected.
              </span>{" "}
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-scroll p-4 border  border-recipe-slate mt-2">
              {recipes.map((recipe) => {
                const selected =
                  selectedRecipesRecord[recipe.path + recipe.method];

                return (
                  <div
                    key={recipe.path + recipe.method}
                    className={classNames(
                      "border rounded-md p-3 relative cursor-pointer border-recipe-slate recipe-hover hover:!outline-accent",
                      selected ? "bg-base-300 " : "bg-base-100"
                    )}
                    onClick={() => {
                      setSelectedRecipesRecord((prev) => {
                        const newRecord = { ...prev };
                        newRecord[recipe.path + recipe.method] = !selected;
                        return newRecord;
                      });
                    }}
                  >
                    <h3 className="font-bold">
                      <RouteTypeLabel recipeMethod={recipe.method} />{" "}
                      {recipe.title}
                    </h3>
                    <p className="line-clam-1 text-xs">{recipe.path}</p>
                    <p className="line-clamp-2 text-sm">{recipe.summary}</p>
                    {selected && (
                      <div className="absolute right-2 top-2">
                        <input
                          type="checkbox"
                          checked={true}
                          readOnly
                          className="checkbox checkbox-accent"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {!finishedStages.has(ImportStage.Auth) &&
            numOfSelectedRecipes !== 0 && (
              <button
                className="btn btn-accent"
                disabled={numOfSelectedRecipes === 0}
                onClick={() => {
                  setFinishedStages((prev) => {
                    return new Set(prev).add(ImportStage.Auth);
                  });
                }}
              >
                Continue
              </button>
            )}
        </>
      )}

      {numOfSelectedRecipes > 0 && (
        <>
          {finishedStages.has(ImportStage.Auth) && (
            <>
              <AuthForm
                authType={authType}
                setAuthType={setAuthType}
                queryParamKey={queryParamKey}
                setQueryParamKey={setQueryParamKey}
                authConfigs={authConfigs}
                setAuthConfigs={setAuthConfigs}
                authDocs={authDocs}
                setAuthDocs={setAuthDocs}
              />

              {!finishedStages.has(ImportStage.Project) && (
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    setFinishedStages((prev) => {
                      return new Set(prev).add(ImportStage.Project);
                    });
                  }}
                >
                  Continue
                </button>
              )}
            </>
          )}
        </>
      )}

      {finishedStages.has(ImportStage.Project) && (
        <div>
          {projects.length > 0 && (
            <>
              <h1 className="text-2xl font-bold dark:text-gray-100">
                Choose a Project
              </h1>
              <div className="grid grid-cols-2 gap-3 my-2">
                {projects.map((project) => {
                  return (
                    <SelectionBox
                      key={project.id}
                      description={project.description}
                      title={project.title}
                      selected={project.project === selectedProject}
                      onClick={() => {
                        setSelectedProject(project.project);
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
          <p className="my-2">
            Double check everything before submitting below.
          </p>
          <button
            className="btn btn-accent"
            onClick={() => {
              setSubmitting(true);
              setTimeout(() => {
                onSubmit();
              }, 500);
            }}
            disabled={submitting}
          >
            Submit
            {submitting && <span className="loading loading-bars"></span>}
          </button>
        </div>
      )}
    </div>
  );
}

function AuthForm({
  authType,
  setAuthType,
  queryParamKey,
  setQueryParamKey,
  authConfigs,
  setAuthConfigs,
  authDocs,
  setAuthDocs,
}: {
  authType: AuthFormType;
  setAuthType: (type: AuthFormType) => void;
  queryParamKey: string;
  setQueryParamKey: (key: string) => void;
  authConfigs: AuthConfig["payload"][];
  setAuthConfigs: (configs: SetStateAction<AuthConfig["payload"][]>) => void;
  authDocs: string;
  setAuthDocs: (docs: string) => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold dark:text-gray-100">Auth Type</h1>
      <p>
        How can people use your API? If your auth is custom, contact us so we
        can support you ASAP. Reach out to team@recipeui.com.
      </p>
      <div className="grid grid-cols-2 py-2 gap-3">
        <SelectionBox
          title="None"
          description="Perfect if you're under a VPN, testing a local API, or just don't need auth."
          selected={authType === AuthFormType.None}
          onClick={() => setAuthType(AuthFormType.None)}
        />
        <SelectionBox
          title="Bearer Token"
          description="This is the most common auth type. You'll need to provide a bearer token in the header of the request (e.g Bearer <token>)."
          selected={authType === AuthFormType.Bearer}
          onClick={() => setAuthType(AuthFormType.Bearer)}
        />

        <SelectionBox
          title="Query Params"
          description="Auth is a in the URL with a query param (e.g www.example.com?api_key=1234)"
          selected={authType === AuthFormType.QueryParam}
          onClick={() => {
            setAuthType(AuthFormType.QueryParam);
          }}
        />
        <SelectionBox
          title="Custom Header(s)"
          description="Some APIs require multiple params."
          selected={authType === AuthFormType.MultipleParams}
          onClick={() => {
            setAuthType(AuthFormType.MultipleParams);
          }}
        />
        <SelectionBox
          title="OAuth (Contact Us)"
          description="Contact us at team@recipeui.com."
          selected={false}
          onClick={() => {}}
          disabled
        />
        <SelectionBox
          title="Custom"
          description="Contact us at team@recipeui.com."
          selected={false}
          onClick={() => {}}
          disabled
        />
      </div>
      {authType === AuthFormType.QueryParam && (
        <div className="flex flex-col mt-4 w-full">
          <h3 className="font-bold text-lg">Query Param Setup</h3>
          <div className="form-control w-full">
            <label className="label p-0 py-1">
              <span className="label-text">
                Variable Name (e.g www.example.com/?
                <span className="font-bold">{queryParamKey}</span>
                =API_KEY_HERE)
              </span>
            </label>
            <input
              type="text"
              placeholder="Query API key here"
              className="input input-bordered w-full max-w-xs"
              value={queryParamKey}
              onChange={(e) => setQueryParamKey(e.target.value)}
            />
          </div>
        </div>
      )}
      {authType === AuthFormType.MultipleParams && (
        <div className="flex flex-col mt-4">
          <div className="flex space-x-4 items-center">
            <h3 className="font-bold text-lg">Custom Header(s) </h3>
            <button
              className="btn btn-accent w-fit btn-xs"
              onClick={() => {
                setAuthConfigs((prev) => {
                  return prev.concat({
                    name: "X-Custom-Header-" + Number(prev.length + 1),
                    prefix: "",
                  });
                });
              }}
            >
              New Header
            </button>
          </div>
          <p className="mt-2">Configure the headers you need.</p>
          <div className="flex space-x-3 mt-4">
            {authConfigs.map((config) => {
              return (
                <div key={config.name} className="border p-4 rounded-md">
                  <div className="flex space-x-4">
                    <div>
                      <div className="text-sm">Header Name</div>
                      <input
                        className="input input-xs input-bordered"
                        value={config.name}
                        onChange={(e) => {
                          setAuthConfigs((prev) => {
                            return prev.map((c) => {
                              if (c.name === config.name) {
                                return {
                                  ...c,
                                  name: e.target.value,
                                };
                              }
                              return c;
                            });
                          });
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-sm">Header Prefix</div>
                      <input
                        className="input input-xs input-bordered"
                        value={config.prefix}
                        placeholder="e.g Bearer"
                        onChange={(e) => {
                          setAuthConfigs((prev) => {
                            return prev.map((c) => {
                              if (c.name === config.name) {
                                return {
                                  ...c,
                                  prefix: e.target.value,
                                };
                              }
                              return c;
                            });
                          });
                        }}
                      />
                    </div>
                  </div>
                  <pre className="mt-2 text-xs">
                    {config.name}: {config.prefix ? config.prefix + " " : ""}
                    API_KEY_HERE
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4">
        <p>Link to documentation about auth (Optional)</p>
        <input
          className="input input-sm mt-2"
          value={authDocs}
          onChange={(e) => {
            setAuthDocs(e.target.value);
          }}
        />
      </div>
    </div>
  );
}

function SelectionBox({
  title,
  description,
  selected,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={classNames(
        "border rounded-md p-3 relative cursor-pointer flex flex-col items-start justify-start border-recipe-slate recipe-hover",
        disabled && "pointer-events-none opacity-40",
        selected && "border-accent"
      )}
      onClick={onClick}
    >
      <h3 className="font-bold text-start">{title}</h3>
      <p className="line-clamp-2 text-sm text-start">{description}</p>
      {selected && (
        <div className="absolute right-2 top-2">
          <input
            type="checkbox"
            checked={true}
            className="checkbox checkbox-accent"
            readOnly
          />
        </div>
      )}
    </button>
  );
}
