"use client";
import classNames from "classnames";
import { useEffect, useState } from "react";
import {
  DesktopPage,
  RecipeSessionFolder,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Modal } from "../../../components/Modal";

import { getSessionRecord } from "../../../state/apiSession";
import { TableInserts } from "types/database";
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
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

export function PublishFolderModal({
  onClose,
  folder,
}: {
  onClose: () => void;
  folder: RecipeSessionFolder;
}) {
  const [recipes, setRecipes] = useState<TableInserts<"recipe">[]>([]);
  const [loading, setLoading] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);
  const supabase = useSupabaseClient();

  const recipeCloud = useRecipeCloud();
  const cloudCollection = recipeCloud.collectionRecord[folder.id];
  const cloudAPIs = cloudCollection
    ? recipeCloud.collectionToApis[cloudCollection.project] ?? []
    : [];

  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);

  const loadRecipes = async () => {
    if (!user) {
      alert("You must login to publish collections.");
      return;
    }

    const { sessionIds, name, id } = folder;

    let recipes: TableInserts<"recipe">[] = [];
    const sessionRecord = await getSessionRecord();
    const seen = new Set<string>();

    let defaultSelected: string[] = [];
    for (const cloudAPI of cloudAPIs) {
      const existingAPI = recipeCloud.apiRecord[cloudAPI];

      if (existingAPI) {
        const coreRecipe = await CoreRecipeAPI.getCoreRecipe({
          recipeId: existingAPI.id,
          userId: user.user_id,
          existingRecipe: existingAPI,
        });

        recipes.push(coreRecipe);
        seen.add(existingAPI.id);
        defaultSelected.push(existingAPI.id);
      }
    }

    for (const sessionId of sessionIds) {
      const session = sessionRecord[sessionId];
      if (!session) continue;
      if (seen.has(session.recipeId)) continue;

      seen.add(session.recipeId);
      const recipe = await CoreRecipeAPI.getCoreRecipe({
        recipeId: session.recipeId,
        userId: user.user_id,
      });

      recipes.push(recipe);
    }

    setRecipes(recipes);
    setSelectedRecipeIds(defaultSelected);
  };

  useEffect(() => {
    if (cloudAPIs.length > 0) {
      loadRecipes();
    }
  }, [cloudCollection]);

  const [error, setError] = useState<string | null>(null);

  const isTauri = useIsTauri();

  const setDestkopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();

  const onSubmit = async () => {
    async function _submit() {
      setError(null);
      if (selectedRecipeIds.length === 0) {
        setError("You must select at least one API to publish.");
        return;
      }

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

      const uploadRes: TableInserts<"recipe">[] = recipes
        .filter((recipe) => selectedRecipeIds.includes(recipe?.id!))
        .map((recipe) => {
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
        {recipes.length === 0 ? (
          <button
            className="btn btn-neutral"
            disabled={loading}
            onClick={loadRecipes}
          >
            Sync APIs
          </button>
        ) : (
          <>
            <h2 className="font-bold text-lg">APIs</h2>
            <p>
              {`Select which APIs you'd like to be published. To edit the title and description of an API, edit them in the docs tab of the actual request.`}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {recipes.map((recipe, i) => {
                return (
                  <button
                    key={recipe.id}
                    className={classNames(
                      "flex items-center border p-4 rounded-md text-start cursor-pointer",
                      selectedRecipeIds.includes(recipe.id!) &&
                        "bg-accent text-white border-none"
                    )}
                    onClick={() => {
                      if (selectedRecipeIds.includes(recipe.id!)) {
                        setSelectedRecipeIds(
                          selectedRecipeIds.filter((id) => id !== recipe.id)
                        );
                      } else {
                        setSelectedRecipeIds([
                          ...selectedRecipeIds,
                          recipe.id!,
                        ]);
                      }
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <h3 className="font-bold">{recipe.title}</h3>
                      <p className="text-sm  ">{recipe.summary}</p>
                      {recipe.id && recipeCloud.apiRecord[recipe.id] && (
                        <span
                          className={classNames(
                            "badge badge-sm mt-2",
                            selectedRecipeIds.includes(recipe.id!)
                              ? "badge-primary"
                              : "badge-accent"
                          )}
                        >
                          Cloud
                        </span>
                      )}
                    </div>
                  </button>
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
          </>
        )}
      </div>
    </Modal>
  );
}
