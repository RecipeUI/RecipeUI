"use client";
import classNames from "classnames";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DesktopPage,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Modal } from "../../../components/Modal";

import { SessionAPI, getSessionRecord } from "../../../state/apiSession";
import {
  AuthConfig,
  Recipe,
  RecipeSession,
  RecipeSessionFolderExtended,
  TableInserts,
  Tables,
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
  RecipeCloudContextType,
  cloudEventEmitter,
} from "../../../state/apiSession/CloudAPI";
import {
  ArrowPathIcon,
  FolderIcon,
  LinkIcon,
  SparklesIcon,
  TrashIcon,
  CloudIcon,
} from "@heroicons/react/24/outline";

import { produce } from "immer";
import { FolderAPI } from "../../../state/apiSession/FolderAPI";
import { OutputAPI } from "../../../state/apiSession/OutputAPI";
import { SecretAPI } from "../../../state/apiSession/SecretAPI";
import { isUUID, sleep } from "utils";
import { RECIPE_UI_BASE_URL } from "../../../utils/constants/main";
import { revalidatePath } from "next/cache";

export function PublishFolderModal({
  onClose,
  folder,
}: {
  onClose: () => void;
  folder: RecipeSessionFolderExtended;
}) {
  const [loading, setLoading] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);
  const recipeCloud = useContext(RecipeCloudContext);
  const [error, setError] = useState<string | null>(null);

  const foldersToRecipes = useFolderToRecipes(folder);
  const publishFolder = usePublishFolder(folder);

  const onSubmit = async () => {
    async function _submit() {
      setError(null);

      try {
        await publishFolder();
      } catch (e) {
        console.error(e);
        setError(
          "message" in (e as Error)
            ? (e as Error).message
            : "Unable to publish collection. Look at console to debug."
        );
      }
    }

    setLoading(true);
    await _submit();
    setLoading(false);
  };

  const cloudCollection = recipeCloud.collectionRecord[folder.id];

  const apisToDelete = useMemo(() => {
    const cloudApis =
      recipeCloud.collectionToApis[cloudCollection?.project ?? ""] || [];

    const apiCloudIds = new Set(
      foldersToRecipes.map((f) => f.recipes.map((r) => r.id)).flat()
    );

    return cloudApis
      .filter((api) => !apiCloudIds.has(api))
      .map((api) => recipeCloud.apiRecord[api])
      .filter(Boolean) as Recipe[];
  }, [foldersToRecipes, recipeCloud]);

  if (!isUUID(folder.id)) {
    return (
      <Modal onClose={onClose} header="Publish collection" size="lg">
        <div className="mt-2 space-y-4">
          <div className="alert alert-error text-sm font-bold">
            This is a protected folder. Please migrate your APIs and folders to
            another folder to save them to the cloud.
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      header={cloudCollection ? "Sync Collection" : "Publish collection"}
      size="lg"
    >
      <div className="mt-2 space-y-4">
        {!user && (
          <div className="alert alert-error text-sm font-bold">
            You must login to publish collections because they will be published
            under your account.
          </div>
        )}
        {
          <>
            {!cloudCollection ? (
              <p className="text-sm">
                This will publish all APIs in your folder as a collection so you
                can share them.
              </p>
            ) : (
              <p className="text-sm">
                This will sync your{" "}
                <a
                  href={`${RECIPE_UI_BASE_URL}/${cloudCollection?.id}`}
                  className="badge badge-sm badge-accent py-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  online collection <LinkIcon className="inline w-3 h-3 ml-2" />
                </a>{" "}
                with the latest APIs and file tree.
              </p>
            )}
            <ul className="text-sm list-disc pl-8 !mt-2">
              <li>
                Visibility of collections is defaulted to{" "}
                <span
                  className="underline underline-offset-2 tooltip tooltip-right"
                  data-tip="Users can only
          access through a URL you share with them."
                >
                  unlisted
                </span>
                .
              </li>

              <li>
                To update a collection later, you will need to redo the publish
                flow.
              </li>
            </ul>
          </>
        }
        <div className="text-sm"></div>
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
                  let type: "Cloud" | "New" = "New";

                  if (recipe.id && recipeCloud.apiRecord[recipe.id]) {
                    type = "Cloud";
                  }

                  return (
                    <PublishPreviewCard
                      key={recipe.id}
                      title={recipe.title}
                      summary={recipe.summary}
                      type={type}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {apisToDelete.map((recipe) => {
              return (
                <PublishPreviewCard
                  key={recipe.id}
                  title={recipe.title}
                  summary={recipe.summary}
                  type="Desync"
                />
              );
            })}
          </div>
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

function PublishPreviewCard({
  title,
  summary,
  type,
}: {
  title: string;
  summary: string;
  type: "Cloud" | "New" | "Desync";
}) {
  return (
    <div
      className={classNames(
        "flex items-center border p-4 rounded-md text-start"
      )}
    >
      <div className="flex flex-col h-full">
        <span
          className={classNames(
            "badge badge-lg mb-2 rounded-md",
            type === "Cloud" && "badge-accent",
            type === "New" && "badge-info font-old",
            type === "Desync" && "badge-error"
          )}
        >
          {type}
          {type === "New" && <SparklesIcon className="inline w-3 h-3 ml-1" />}
          {(type === "Desync" || type === "Cloud") && (
            <ArrowPathIcon className="inline w-3 h-3 ml-1" />
          )}
          {/* {type === "Cloud" && <CloudIcon className="inline w-3 h-3 ml-1" />} */}
        </span>

        <h3 className="font-bold">{title}</h3>
        <p className="text-sm  ">{summary}</p>

        <div className="flex-1" />
      </div>
    </div>
  );
}

function usePublishFolder(folder: RecipeSessionFolderExtended) {
  const recipeCloud = useContext(RecipeCloudContext);
  const supabase = useSupabaseClient();
  const user = useRecipeSessionStore((state) => state.user);
  const foldersToRecipes = useFolderToRecipes(folder);
  const closeSession = useRecipeSessionStore((state) => state.closeSession);

  const isTauri = useIsTauri();
  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  /*
    If the collection is not in the cloud
      - Create a new cloud collection
      - Upload all APIs and point them to the new collection
      - Migrate old sessions locally to point to cloud session IDs

    If collection in cloud
      - Update collection folder/session file tree
      - Update all APIs in a collection
        - If API in cloud already, overwrite it
        - If API not in cloud, upload it
      - Migrate old sessions locally to point to cloud session IDs
      - Sessions that have moved out of a collection completely should be deleted from cloud
  */
  const publishFolder = useCallback(async () => {
    const sessionRecord = await getSessionRecord();
    const cloudCollection = recipeCloud.collectionRecord[folder.id];
    const projectName = cloudCollection?.project ?? generateSlug(4);
    let projectId = cloudCollection?.id || "";

    const { newFolder, recipes, valuesToFix } = await getRecipesAndBackFill({
      authorId: user?.user_id ?? "",
      foldersToRecipes,
      recipeCloud,
      sessionRecord,
      folder,
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
        throw new Error(
          projectRes.error.message ?? "Unable to create this collection"
        );
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
      throw new Error(
        uploadRecipes.error.message ?? "Unable to upload recipes"
      );
    }

    if (cloudCollection) {
      await desyncRecipesNotInProject({
        collectionProject: projectName,
        recipeCloud,
        supabase,
        uploadRecipes: uploadRecipes.data,
      });
    }

    await migrateOldSessions(uploadRecipes.data, valuesToFix, closeSession);

    cloudEventEmitter.emit("syncCloudForce");

    if (isTauri) {
      setDesktopPage({
        page: DesktopPage.Project,
        pageParam: projectName,
      });
    } else {
      router.push(`/${projectId}`);
      router.refresh();
    }
  }, [
    folder,
    closeSession,
    foldersToRecipes,
    isTauri,
    recipeCloud,
    router,
    setDesktopPage,
    supabase,
    user?.user_id,
  ]);

  return publishFolder;
}

async function getRecipesAndBackFill({
  foldersToRecipes,
  recipeCloud,
  sessionRecord,
  authorId,
  folder,
}: {
  foldersToRecipes: ReturnType<typeof useFolderToRecipes>;
  recipeCloud: RecipeCloudContextType;
  sessionRecord: Awaited<ReturnType<typeof getSessionRecord>>;
  authorId: string;
  folder: RecipeSessionFolderExtended;
}) {
  const recipesToFix: {
    [oldId: string]: {
      oldSession: RecipeSession;
      newId: string;
      authConfig?: AuthConfig;
    };
  } = {};

  // TODO: This isn't  processing new items corretctly. These items should exist in cloud, oh, i see
  const recipes = foldersToRecipes
    .map((folder) => folder.recipes)
    .flat()
    .map((recipe) => {
      if (recipe.id && recipeCloud.apiRecord[recipe.id]) {
        return recipe;
      }

      // APIs/Recipes we upload to the cloud need a brand new session ID.
      // This is mainly to deal with 2-way syncing problems when people reupload
      // a sessionId that already exists in the cloud.
      const recipeId = uuidv4();
      const oldSession = sessionRecord[recipe.id || ""];
      if (recipe.id && oldSession) {
        recipesToFix[recipe.id] = {
          oldSession: oldSession,
          newId: recipeId,
          authConfig: recipe.authConfig || undefined,
        };
      }

      return {
        ...recipe,
        author_id: authorId,
        id: recipeId,
      };
    });

  // Backfill all old sessions to have the new sessions
  const newFolder = produce(folder, (draft) => {
    function travel(folder: RecipeSessionFolderExtended) {
      for (const item of folder.items) {
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

  return { newFolder, valuesToFix: Object.values(recipesToFix), recipes };
}
async function migrateOldSessions(
  uploadRecipes: Tables<"recipe">[],
  valuesToFix: Awaited<ReturnType<typeof getRecipesAndBackFill>>["valuesToFix"],
  closeSession: (session: RecipeSession) => RecipeSession | undefined
) {
  for (let i = 0; i < uploadRecipes.length; i++) {
    const recipe = uploadRecipes[i];
    const valueToFix = valuesToFix.find((v) => v.newId === recipe.id);
    const oldSession = valueToFix?.oldSession;
    if (oldSession && valueToFix) {
      if (valueToFix.authConfig) {
        await SecretAPI._migrateSecrets({
          authConfig: valueToFix.authConfig,
          newId: recipe.id,
          oldId: oldSession.recipeId,
        });
      }
      await OutputAPI._migrateOutput(oldSession.recipeId, recipe.id);
      await SessionAPI._migrateParameters(oldSession.recipeId, recipe.id);

      console.debug("Deleting old session", oldSession);

      closeSession(oldSession);

      await FolderAPI.deleteSessionFromFolder(
        oldSession.id,
        i === uploadRecipes.length - 1 ? false : true
      );
    }
  }
}

async function desyncRecipesNotInProject({
  collectionProject,
  recipeCloud,
  uploadRecipes,
  supabase,
}: {
  collectionProject: string;
  uploadRecipes: Tables<"recipe">[];
  recipeCloud: RecipeCloudContextType;
  supabase: ReturnType<typeof useSupabaseClient>;
}) {
  const recipesInOriginalCollection =
    recipeCloud.collectionToApis[collectionProject];

  if (!recipesInOriginalCollection) {
    return;
  }

  const uploadedRecipeIds = new Set(uploadRecipes.map((r) => r.id));
  const recipesToDesync = recipesInOriginalCollection.filter(
    (r) => !uploadedRecipeIds.has(r)
  );

  try {
    console.debug("Desyncing recipes", recipesToDesync);
    await supabase.from("recipe").delete().in("id", recipesToDesync);
  } catch (e) {
    console.error(e);
  }
}

function useFolderToRecipes(folder: RecipeSessionFolderExtended) {
  const [foldersToRecipes, setFoldersToRecipes] = useState<
    {
      folderPath: string;
      recipes: (TableInserts<"recipe"> & {
        folderId: string;
      })[];
    }[]
  >([]);
  const user = useRecipeSessionStore((state) => state.user);
  const recipeCloud = useContext(RecipeCloudContext);

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

  return foldersToRecipes;
}

interface FolderPathToRecipes {
  [folderPath: string]: (TableInserts<"recipe"> & { folderId: string })[];
}
