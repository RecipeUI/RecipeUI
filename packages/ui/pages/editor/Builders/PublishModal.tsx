"use client";
import classNames from "classnames";
import { Fragment, useContext, useEffect, useState } from "react";
import {
  DesktopPage,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Modal } from "../../../components/Modal";

import { getSessionRecord } from "../../../state/apiSession";
import { RecipeSessionFolderExtended, TableInserts } from "types/database";
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
  useRecipeCloud,
} from "../../../state/apiSession/CloudAPI";
import { FolderIcon } from "@heroicons/react/24/outline";
import { useSessionFolders } from "../../../state/apiSession/FolderAPI";

interface FolderPathToRecipes {
  [folderPath: string]: TableInserts<"recipe">[];
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
      recipes: TableInserts<"recipe">[];
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

              folderPathToRecipes[folderPath].push(recipe);
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
        Object.entries(folderPathToRecipes).map(([folderPath, recipes]) => ({
          folderPath,
          recipes,
        }))
      );
    }

    loadRecipes();
  }, [folder, user]);

  const [error, setError] = useState<string | null>(null);

  const isTauri = useIsTauri();

  const setDestkopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();

  const onSubmit = async () => {
    async function _submit() {
      setError(null);

      let projectName = cloudCollection?.project ?? generateSlug(4);
      let projectId = cloudCollection?.id || "";

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
            folder: folder,
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
            folder: folder,
          })
          .eq("id", projectId);
      }

      const recipes = foldersToRecipes.map((folder) => folder.recipes).flat();

      const uploadRes: TableInserts<"recipe">[] = recipes.map((recipe) => {
        if (recipe.id && recipeCloud.apiRecord[recipe.id]) {
          return recipe;
        }

        return {
          ...recipe,
          project: projectName,
          author_id: user?.user_id,
          id: recipe.id ?? uuidv4(),
        };
      });

      const uploadRecipes = await supabase
        .from("recipe")
        .upsert(uploadRes, { onConflict: "id", ignoreDuplicates: false })
        .select("*");

      if (uploadRecipes.error) {
        setError(uploadRecipes.error.message ?? "Unable to upload recipes");
        return;
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
          disabled={loading}
        >
          Upload {loading && <span className="loading loading-bars" />}
        </button>
      </div>
    </Modal>
  );
}
