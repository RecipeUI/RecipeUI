"use client";
import { useRecipeSessionStore } from "../../../state/recipeSession";
import { FolderAPI } from "../../../state/apiSession/FolderAPI";
import { Modal } from "../../Modal";
import { useForm } from "react-hook-form";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import { RecipeCloudContext } from "../../../state/apiSession/CloudAPI";
import { RecipeSessionFolderExtended } from "types/database";
import { useContext, useEffect } from "react";
import { produce } from "immer";

export function EditFolderModal({
  onClose,
  folder,
}: {
  onClose: () => void;
  folder: RecipeSessionFolderExtended;
}) {
  const closeSessions = useRecipeSessionStore((state) => state.closeSessions);
  const { register, handleSubmit } = useForm<{
    folderName: string;
  }>({
    defaultValues: {
      folderName: folder.name,
    },
  });
  const recipeCloud = useContext(RecipeCloudContext);
  const cloudCollection = recipeCloud.collectionRecord[folder.id];
  const cloudFolder = !!recipeCloud.folderToCollection[folder.id];

  const onSubmit = handleSubmit(async (data) => {
    await FolderAPI.editFolderName(folder.id, data.folderName);

    onClose();
  });

  const supabase = useSupabaseClient();

  return (
    <Modal header="Edit Folder" onClose={onClose} size="sm">
      <form className="mt-1 flex flex-col" onSubmit={onSubmit}>
        <p>Change folder name</p>
        <input
          type="text"
          placeholder="Folder Name"
          className="input input-bordered input-sm w-full mt-1"
          {...register("folderName", {
            required: true,
          })}
        />
        <div className="mt-4">
          <button className=" btn btn-neutral w-fit btn-sm" type="submit">
            Submit
          </button>
        </div>
      </form>
      <div className="divider" />
      <div className="recipe-slate">
        <div className="mt-4">
          <div className="space-y-1">
            {cloudCollection ? (
              <>
                <p>Delete collection</p>
              </>
            ) : folder.items.length > 0 ? (
              <>
                <p>Delete folder</p>
                <p className="text-sm">
                  This will also delete all items inside of the folder
                </p>
              </>
            ) : null}
          </div>

          <button
            className="btn btn-error w-fit btn-sm mt-4"
            onClick={async () => {
              const confirm = await window.confirm(
                cloudCollection
                  ? "Are you sure you want to delete this collection"
                  : "Are you sure you want to delete this folder? This will remove all items inside of it."
              );

              if (confirm) {
                const { affectedSessionIds } = await FolderAPI.removeFolder(
                  folder.id
                );
                closeSessions(affectedSessionIds);

                if (cloudCollection) {
                  await supabase
                    .from("recipe")
                    .delete()
                    .match({ project: cloudCollection.project });
                  await supabase
                    .from("project_member")
                    .delete()
                    .match({ project: cloudCollection.project });
                  await supabase
                    .from("project")
                    .delete()
                    .match({ id: cloudCollection.id });
                } else if (cloudFolder) {
                  await supabase
                    .from("recipe")
                    .delete()
                    .in("id", affectedSessionIds);

                  const parentCollection =
                    recipeCloud.collectionRecord[
                      recipeCloud.folderToCollection[folder.id] || ""
                    ];

                  if (parentCollection) {
                    const newFolder = produce(
                      parentCollection.folder as RecipeSessionFolderExtended,
                      (draft) => {
                        function travel(
                          innerFolder: RecipeSessionFolderExtended
                        ) {
                          innerFolder.items = innerFolder.items.filter(
                            (item) => {
                              if (item.id === folder.id) return false;

                              if (item.type === "folder") {
                                travel(item.folder);
                              }

                              return true;
                            }
                          );
                        }

                        travel(draft);
                      }
                    );

                    const project = await supabase
                      .from("project")
                      .update({
                        folder: newFolder,
                      })
                      .eq("id", parentCollection.id)
                      .select("*");
                  }
                }

                onClose();
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
