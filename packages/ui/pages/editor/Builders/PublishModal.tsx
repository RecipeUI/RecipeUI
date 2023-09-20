"use client";
import classNames from "classnames";
import { useEffect, useState } from "react";
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
import { useRecipeCloud } from "../../../state/apiSession/CloudAPI";
import { FolderIcon } from "@heroicons/react/24/outline";
import { useSessionFolders } from "../../../state/apiSession/FolderAPI";

export function PublishFolderModal({
  onClose,
  folder,
}: {
  onClose: () => void;
  folder: RecipeSessionFolderExtended;
}) {
  const [recipes, setRecipes] = useState<
    (TableInserts<"recipe"> & {
      folderPath: string;
    })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);
  const supabase = useSupabaseClient();
  const recipeCloud = useRecipeCloud();
  const cloudCollection = recipeCloud.collectionRecord[folder.id];
  const { folders } = useSessionFolders();

  useEffect(() => {
    async function loadRecipes() {
      if (!user) {
        alert("You must login to publish collections.");
        return;
      }

      let recipes: (TableInserts<"recipe"> & {
        folderPath: string;
      })[] = [];
      const sessionRecord = await getSessionRecord();
      const seen = new Set<string>();

      async function recursivelyGetFolders(
        currFolder: RecipeSessionFolderExtended,
        folderPath: string
      ) {
        for (const item of currFolder.items) {
          if (item.type === "session") {
            const session = sessionRecord[item.id];
            if (!session) continue;
            if (seen.has(session.recipeId)) continue;
            seen.add(session.recipeId);

            const recipe = await CoreRecipeAPI.getCoreRecipe({
              recipeId: session.recipeId,
              userId: user?.user_id,
            });

            recipes.push({ ...recipe, folderPath });
          } else if (item.type === "folder") {
            await recursivelyGetFolders(
              item.folder,
              `${folderPath}/${item.folder.name}`
            );
          }
        }
      }

      await recursivelyGetFolders(folder, "");
      setRecipes(recipes);
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
      }

      const uploadRes: TableInserts<"recipe">[] = recipes.map(
        ({ folderPath, ...recipe }) => {
          if (recipe.id && recipeCloud.apiRecord[recipe.id]) {
            return recipe;
          }

          // TODO: We need a better binding for API/recipes. Oh let's attach special modules to options
          return {
            ...recipe,
            project: projectName,
            author_id: user?.user_id,
            id: recipe.id ?? uuidv4(),
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
        <div className="grid grid-cols-2 gap-4">
          {recipes.map((recipe, i) => {
            return (
              <div
                key={recipe.id}
                className={classNames(
                  "flex items-center border p-4 rounded-md text-start"
                )}
              >
                <div className="flex flex-col h-full">
                  <h3 className="font-bold">{recipe.title}</h3>
                  <p className="text-sm  ">{recipe.summary}</p>
                  {recipe.folderPath && (
                    <span
                      className={classNames(
                        "badge badge-accent mt-2 rounded-md inline-flex items-center"
                      )}
                    >
                      <FolderIcon className="w-4 h-4 mr-1" />{" "}
                      {recipe.folderPath}
                    </span>
                  )}
                  {recipe.id && recipeCloud.apiRecord[recipe.id] && (
                    <span className={classNames("badge badge-sm mt-2")}>
                      Cloud
                    </span>
                  )}
                </div>
              </div>
            );
          })}
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
