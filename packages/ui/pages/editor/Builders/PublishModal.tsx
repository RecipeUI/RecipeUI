"use client";
import classNames from "classnames";
import { useContext, useEffect, useState } from "react";
import {
  DesktopPage,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Modal } from "../../../components/Modal";

import { SessionAPI, getSessionRecord } from "../../../state/apiSession";
import {
  AuthConfig,
  RecipeSession,
  RecipeSessionFolderExtended,
  TableInserts,
} from "types/database";
import { CoreRecipeAPI } from "../../../state/apiSession/RecipeAPI";
import { useSupabaseClient } from "../../../components/Providers/SupabaseProvider";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "random-word-slugs";
import {
  ProjectScope,
  ProjectVisibility,
  RecipeProjectStatus,
} from "types/enums";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { useRouter } from "next/navigation";
import { DISCORD_LINK } from "utils/constants";
import {
  RecipeCloudContext,
  cloudEventEmitter,
} from "../../../state/apiSession/CloudAPI";
import { FolderIcon } from "@heroicons/react/24/outline";
import { produce } from "immer";
import { FolderAPI } from "../../../state/apiSession/FolderAPI";
import { OutputAPI } from "../../../state/apiSession/OutputAPI";
import { SecretAPI } from "../../../state/apiSession/SecretAPI";

interface FolderPathToRecipes {
  [folderPath: string]: (TableInserts<"recipe"> & { folderId: string })[];
}

export function PublishFolderModal({
  onClose,
  folder,
}: {
  onClose: () => void;
  folder: RecipeSessionFolderExtended;
}) {
  const [loading, setLoading] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);
  const supabase = useSupabaseClient();
  const recipeCloud = useContext(RecipeCloudContext);
  const cloudCollection = recipeCloud.collectionRecord[folder.id];
  const [foldersToRecipes, setFoldersToRecipes] = useState<
    {
      folderPath: string;
      recipes: (TableInserts<"recipe"> & {
        folderId: string;
      })[];
    }[]
  >([]);

  useEffect(() => {
    async function loadRecipes() {
      if (!user) {
        alert("You must login to publish collections.");
        return;
      }

      const sessionRecord = await getSessionRecord();
      const seen = new Set<string>();
      const folderPathToRecipes: FolderPathToRecipes = {};

      async function recursivelyGetFolders(
        currFolder: RecipeSessionFolderExtended,
        folderPath: string
      ) {
        if (!folderPathToRecipes[folderPath]) {
          folderPathToRecipes[folderPath] = [];
        }

        for (const item of currFolder.items) {
          if (item.type === "session") {
            const session = sessionRecord[item.id];
            if (!session) continue;
            if (seen.has(session.recipeId)) continue;
            seen.add(session.recipeId);

            try {
              const recipe = await CoreRecipeAPI.getCoreRecipe({
                recipeId: session.recipeId,
                userId: user?.user_id,
                existingRecipe: recipeCloud.apiRecord[session.recipeId],
              });

              folderPathToRecipes[folderPath].push({
                ...recipe,
                folderId: currFolder.id,
              });
            } catch (e) {
              console.error(e);
            }
          } else if (item.type === "folder") {
            await recursivelyGetFolders(
              item.folder,
              `${folderPath}/${item.folder.name}`
            );
          }
        }

        if (folderPathToRecipes[folderPath].length === 0) {
          delete folderPathToRecipes[folderPath];
        }
      }
      await recursivelyGetFolders(folder, "");
      setFoldersToRecipes(
        Object.entries(folderPathToRecipes).map(([folderPath, recipes]) => {
          return {
            folderPath,
            recipes: recipes,
          };
        })
      );
    }

    loadRecipes();
  }, [folder, user]);

  const [error, setError] = useState<string | null>(null);

  const isTauri = useIsTauri();

  const setDestkopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();
  const closeSession = useRecipeSessionStore((state) => state.closeSession);

  const onSubmit = async () => {
    async function _submit() {
      setError(null);

      const sessionRecord = await getSessionRecord();
      let projectName = cloudCollection?.project ?? generateSlug(4);
      let projectId = cloudCollection?.id || "";

      const recipesToFix: {
        [oldId: string]: {
          oldSession: RecipeSession;
          newId: string;
          folderId: string;
          authConfig?: AuthConfig;
        };
      } = {};

      let recipes = foldersToRecipes.map((folder) => folder.recipes).flat();
      recipes = recipes.map((recipe) => {
        if (recipe.id && recipeCloud.apiRecord[recipe.id]) {
          return recipe;
        }

        let recipeId = recipe.id || "";
        if (!cloudCollection) {
          recipeId = uuidv4();

          const oldSession = sessionRecord[recipe.id || ""];
          if (recipe.id && oldSession) {
            recipesToFix[recipe.id] = {
              oldSession: oldSession,
              newId: recipeId,
              folderId: recipe.folderId,
              authConfig: recipe.authConfig || undefined,
            };
          }
        }

        return {
          ...recipe,
          author_id: user?.user_id,
          id: recipeId,
        };
      });

      let newFolder = produce(folder, (draft) => {
        function travel(_folder: RecipeSessionFolderExtended) {
          for (const item of _folder.items) {
            if (item.type === "session" && recipesToFix[item.id]) {
              item.session.id = recipesToFix[item.id].newId;
              item.id = recipesToFix[item.id].newId;
            } else if (item.type === "folder") {
              travel(item.folder);
            }
          }
        }

        travel(draft);
      });

      if (!cloudCollection) {
        const projectRes = await supabase
          .from("project")
          .insert({
            id: folder.id,
            project: projectName,
            title: folder.name,
            subheader: null,
            description: `APIs for ${folder.name}`,
            status: RecipeProjectStatus.Active,
            image: null,
            tags: [],
            scope: ProjectScope.Personal,
            visibility: ProjectVisibility.Unlisted, // Protected with RLS, private not supported yet
            owner_id: user?.user_id,
            folder: newFolder,
          })
          .select("*")
          .single();

        if (projectRes.error) {
          setError(
            projectRes.error.message ?? "Unable to create this collection"
          );
          return;
        }

        projectId = projectRes.data.id;
      } else {
        await supabase
          .from("project")
          .update({
            folder: newFolder,
          })
          .eq("id", projectId);
      }

      // Add project name to recipeUpsert
      const uploadRes: TableInserts<"recipe">[] = recipes.map(
        ({ folderId, ...recipe }) => {
          return {
            ...recipe,
            project: projectName,
          };
        }
      );

      const uploadRecipes = await supabase
        .from("recipe")
        .upsert(uploadRes, { onConflict: "id", ignoreDuplicates: false })
        .select("*");

      if (uploadRecipes.error) {
        setError(uploadRecipes.error.message ?? "Unable to upload recipes");
        return;
      }

      const valuesToFix = Object.values(recipesToFix);

      // recipe of uploadRecipes.data
      for (let i = 0; i < uploadRecipes.data.length; i++) {
        const recipe = uploadRecipes.data[i];
        const valueToFix = valuesToFix.find((v) => v.newId === recipe.id);
        const oldSession = valueToFix?.oldSession;

        if (oldSession && valueToFix) {
          // We can probably migrate parameters and output

          if (valueToFix.authConfig) {
            await SecretAPI._migrateSecrets({
              authConfig: valueToFix.authConfig,
              newId: recipe.id,
              oldId: oldSession.recipeId,
            });
          }
          await OutputAPI._migrateOutput(oldSession.recipeId, recipe.id);
          await SessionAPI._migrateParameters(oldSession.recipeId, recipe.id);

          closeSession(oldSession);

          await FolderAPI.deleteSessionFromFolder(
            oldSession.id,
            i === uploadRecipes.data.length - 1 ? false : true
          );
        }
      }

      cloudEventEmitter.emit("syncCloud");

      if (isTauri) {
        setDestkopPage({
          page: DesktopPage.Project,
          pageParam: projectName,
        });
      } else {
        router.push(`/${projectId}`);
      }
    }

    setLoading(true);
    await _submit();
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} header="Publish collection" size="lg">
      <div className="mt-2 space-y-4">
        {!user && (
          <div className="alert alert-error text-sm font-bold">
            You must login to publish collections because they will be published
            under your account.
          </div>
        )}
        <p className="text-sm">
          This will publish all APIs in your folder as a collection so you can
          share them. Visibility of collections is defaulted to{" "}
          <span
            className="underline underline-offset-2 tooltip tooltip-right"
            data-tip="Users can only
          access through a URL you share with them."
          >
            unlisted
          </span>
          . If you need a team use case reach out in our{" "}
          <a href={DISCORD_LINK} className="underline underline-offset-2">
            Discord
          </a>
          .
        </p>
        <div className="divider" />
        {error && (
          <div className="alert alert-error text-sm font-bold">{error}</div>
        )}

        <h2 className="font-bold text-lg">APIs</h2>
        <p>
          {`All the APIs below will be published. To edit the docs of an API, go back to the request builder and click the "Docs" button.`}
        </p>
        <div className="space-y-8">
          {foldersToRecipes.map((folderInfo) => (
            <div key={folderInfo.folderPath}>
              {foldersToRecipes.length > 1 && (
                <h2 className="mb-2 font-bold inline-flex items-center">
                  <FolderIcon className="w-6 h-6 mb-0.5 mr-2" />{" "}
                  {folderInfo.folderPath || "/"}
                </h2>
              )}
              <div className="grid grid-cols-2 gap-4">
                {folderInfo.recipes.map((recipe, i) => {
                  return (
                    <div
                      key={recipe.id}
                      className={classNames(
                        "flex items-center border p-4 rounded-md text-start"
                      )}
                    >
                      <div className="flex flex-col h-full">
                        {recipe.id && recipeCloud.apiRecord[recipe.id] ? (
                          <span
                            className={classNames(
                              "badge mb-2 badge-neutral rounded-md"
                            )}
                          >
                            Cloud
                          </span>
                        ) : (
                          <span
                            className={classNames(
                              "badge mb-2 badge-accent rounded-md font-bold"
                            )}
                          >
                            New
                          </span>
                        )}

                        <h3 className="font-bold">{recipe.title}</h3>
                        <p className="text-sm  ">{recipe.summary}</p>

                        <div className="flex-1" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button
          className={"btn btn-sm btn-neutral"}
          onClick={onSubmit}
          disabled={loading || !user}
        >
          Upload {loading && <span className="loading loading-bars" />}
        </button>
      </div>
    </Modal>
  );
}
