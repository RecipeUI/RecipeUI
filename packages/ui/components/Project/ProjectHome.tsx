"use client";

import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import {
  Recipe,
  RecipeProject,
  RecipeSessionFolderExtended,
} from "types/database";
import { QueryKey, RecipeProjectStatus } from "types/enums";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useClipboard, useIsTauri } from "../../hooks/useIsTauri";
import {
  PLAYGROUND_SESSION_ID,
  RECIPE_UI_BASE_URL,
} from "../../utils/constants/main";
import Link from "next/link";
import { ChangeEvent, Fragment, useEffect, useMemo, useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  FolderArrowDownIcon,
  FolderIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { Modal } from "../Modal";
import { FormLabelWrapper } from "../Navbar/FormLabelWrapper";
import { useSupabaseClient } from "../Providers/SupabaseProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useSessionStorage } from "usehooks-ts";
import { COLLECTION_FORKING_ID } from "utils/constants";

export function ProjectHome({
  project,
  recipes,
}: {
  project: RecipeProject;
  recipes: Recipe[];
}) {
  const [editProject, setEditProject] = useState(false);
  const user = useRecipeSessionStore((state) => state.user);

  const [editing, setEditing] = useState(false);

  const supabase = useSupabaseClient();
  const router = useRouter();
  const isTauri = useIsTauri();
  const queryClient = useQueryClient();

  const clipboard = useClipboard();
  const [_, setCollectionFork] = useSessionStorage<string | null>(
    COLLECTION_FORKING_ID,
    null
  );
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const folders = useMemo(() => {
    const folderToSessions: Record<string, Recipe[]> = {};
    if (!project.folder)
      return [
        {
          path: "",
          recipes: recipes,
        },
      ];

    function travel(folder: RecipeSessionFolderExtended, path: string) {
      if (!folderToSessions[path]) {
        folderToSessions[path] = [];
      }

      for (const item of folder.items) {
        if (item.type === "session") {
          const recipe = recipes.find((r) => r.id === item.id);
          if (recipe) {
            folderToSessions[path].push(recipe);
          }
        } else {
          travel(item.folder, `${path}/${item.folder.name}`);
        }
      }

      if (folderToSessions[path].length === 0) {
        delete folderToSessions[path];
      }
    }

    travel(project.folder, "");

    return Object.entries(folderToSessions).map(([path, sessions]) => ({
      path,
      recipes: sessions,
    }));
  }, [project.folder, recipes]);

  const hasMultipleFolders = folders.length > 1;

  return (
    <div className="flex-1 px-4 pt-4">
      <div className="flex justify-start rounded-md border border-slate-200 dark:border-slate-600 min-h-[250px] bg-white dark:bg-slate-800">
        <div className="p-4 flex flex-col space-y-8 lg:space-y-0  justify-start  lg:flex-row lg:items-center lg:space-x-8 relative w-full">
          {project.image && (
            <img
              src={project.image}
              className="max-w-[10rem] rounded-lg"
              alt={project.title}
            />
          )}
          <div className="hidden absolute top-0 lg:top-6 lg:flex-row right-6 sm:flex flex-col gap-2 ">
            {(!user || project.owner_id !== user.user_id) && (
              <button
                className="tooltip tooltip-left"
                data-tip="Fork collection"
                onClick={async () => {
                  const confirmFork = await confirm(
                    "Are you sure you want to fork this collection?"
                  );

                  if (confirmFork) {
                    setCollectionFork(project.id);

                    if (isTauri) {
                      setDesktopPage({
                        page: DesktopPage.Editor,
                      });
                    } else {
                      router.push("/editor");
                    }
                  }
                }}
              >
                <FolderArrowDownIcon className="w-8 h-8 hover:text-accent cursor-pointer" />
              </button>
            )}
            {user && user.user_id === project.owner_id && (
              <>
                <button
                  className="tooltip tooltip-left"
                  data-tip="Edit Collection Details"
                  onClick={() => {
                    setEditProject(true);
                  }}
                >
                  <Cog6ToothIcon className="w-8 h-8 hover:animate-spin hover:text-accent cursor-pointer" />
                </button>
                <button
                  onClick={async () => {
                    await clipboard.writeText(
                      `${RECIPE_UI_BASE_URL}/${project.id}`
                    );

                    alert("Copied to clipboard!");
                  }}
                >
                  <ShareIcon className="w-8 h-8 hover:text-accent cursor-pointer" />
                </button>
              </>
            )}
          </div>
          <div className="sm:ml-4">
            <h1 className="text-5xl font-bold">{project.title}</h1>
            <p className="py-4">{project.description}</p>
          </div>
        </div>
      </div>
      {recipes.length > 0 ? (
        <div
          className={classNames("space-y-12 ", hasMultipleFolders && "mt-12")}
        >
          {folders.map((folder) => {
            return (
              <div key={folder.path}>
                {hasMultipleFolders && (
                  <div className="flex items-center">
                    <FolderIcon className="h-6 mr-2" />
                    <h2 className="text-lg font-bold">{folder.path || "/"}</h2>
                  </div>
                )}
                <div className="projects-home-container">
                  {folder.recipes.map((recipe) => {
                    return (
                      <div className="relative h-full" key={recipe.id}>
                        <ProjectHomeBox
                          recipe={recipe}
                          project={project}
                          editMode={editing}
                        />
                        {editing && (
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <button
                              className="hover:btn-primary btn btn-accent btn-sm text-white  rounded-md"
                              onClick={async () => {
                                const okToDelete = await confirm(
                                  "Are you sure you want to delete this recipe? This cannot be undone."
                                );
                                if (okToDelete) {
                                  await supabase
                                    .from("recipe")
                                    .delete()
                                    .match({ id: recipe.id });

                                  if (isTauri) {
                                    queryClient.invalidateQueries([
                                      QueryKey.Projects,
                                    ]);
                                  } else {
                                    router.refresh();
                                  }
                                }
                              }}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-96">
          <span className="text-3xl font-bold">No recipes yet.</span>
        </div>
      )}
      {editProject && (
        <EditModal project={project} onClose={() => setEditProject(false)} />
      )}
    </div>
  );
}

function EditModal({
  project,
  onClose,
}: {
  project: RecipeProject;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    title: string;
    description: string;
  }>({
    defaultValues: {
      title: project.title,
      description: project.description,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();

  const router = useRouter();

  const queryClient = useQueryClient();

  const isTauri = useIsTauri();

  const onSubmit = handleSubmit(async (data) => {
    async function _submit() {
      let publicUrl: string | null = null;

      if (selectedImage) {
        const { data, error } = await supabase.storage
          .from("assets")
          .upload(`collections/${project.id}/main`, selectedImage, {
            upsert: true,
          });

        if (!error) {
          const { data: publicUrlData } = supabase.storage
            .from("assets")
            .getPublicUrl(`collections/${project.id}/main`);

          publicUrl = publicUrlData.publicUrl || null;
        } else {
          setError(error.message);
          return;
        }
      }

      const updateRes = await supabase
        .from("project")
        .update({
          ...data,
          image: publicUrl,
        })
        .match({ id: project.id });

      if (updateRes.error) {
        setError(updateRes.error.message);
      } else {
        if (isTauri) {
          queryClient.invalidateQueries([QueryKey.Projects]);
        } else {
          router.refresh();
        }
        onClose();
      }
    }

    setLoading(true);
    await _submit();
    setLoading(false);
  });

  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const [selectedImage, setSelectedImage] = useState<File | null>();
  const [imgSrc, setImgSrc] = useState<string | null>(project.image);

  const user = useRecipeSessionStore((state) => state.user);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile?.type.startsWith("image/")) {
      setError("You can only upload image files.");
      return;
    }

    if (selectedFile) {
      setSelectedImage(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <Modal header="Edit Collection Details" onClose={onClose}>
      <form className="w-full space-y-4 mt-4" onSubmit={onSubmit}>
        <FormLabelWrapper label="Title">
          <input
            className="input input-bordered w-full"
            {...register("title", {
              required: true,
            })}
          />
        </FormLabelWrapper>

        <FormLabelWrapper label="Description">
          <textarea
            className="textarea textarea-bordered w-full"
            {...register("description", { required: true })}
          />
        </FormLabelWrapper>
        <FormLabelWrapper label="Image (Optional)">
          <input
            type="file"
            className="file-input file-input-bordered w-full max-w-xs mt-2"
            onChange={handleFileChange}
          />

          {imgSrc && (
            <img
              src={imgSrc}
              className="max-w-[10rem] rounded-lg my-4"
              alt={project.title}
            />
          )}
        </FormLabelWrapper>

        {(errors.title || errors.description) && (
          <p className="alert alert-error !mt-4">
            Please fill out all required fields.
          </p>
        )}
        {error && <p className="alert alert-error !mt-4">{error}</p>}

        <div className="grid grid-cols-2 gap-x-2">
          <button type="submit" className="btn btn-accent">
            Save
          </button>
          <button
            className="btn btn-error"
            onClick={async () => {
              const deletionConfirm = await confirm(
                "Are you sure you want to delete this collection? This cannot be undone."
              );
              if (!deletionConfirm) return;

              await supabase
                .from("recipe")
                .delete()
                .match({ project: project.project });
              await supabase
                .from("project_member")
                .delete()
                .match({ project: project.project });
              await supabase.from("project").delete().match({ id: project.id });

              if (isTauri) {
                setDesktopPage(null);
              } else {
                router.push("/collections");
              }

              // onClose();
            }}
          >
            Delete
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectHomeBox({
  recipe,
  project,
  editMode = false,
}: {
  recipe: Recipe;
  project: RecipeProject;
  editMode?: boolean;
}) {
  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const createdAt = new Date(recipe.created_at!);
  const currentTime = new Date();
  const difference = currentTime.getTime() - createdAt.getTime();
  const isTauri = useIsTauri();

  return (
    <Link
      href={`/a/${recipe.id}`}
      className={classNames(
        "border border-slate-700 rounded-md p-4 space-y-1 flex flex-col h-full cursor-pointer recipe-container-box",
        difference < 300000 && "border-accent"
      )}
      onClick={(e) => {
        if (isTauri) {
          e.preventDefault();
          setDesktopPage({
            page: DesktopPage.RecipeView,
            pageParam: recipe.id,
          });
        }
      }}
    >
      <div className="flex justify-between ">
        <div className="flex items-center mr-2">
          <h2 className="font-bold text-lg dark:text-gray-300">
            {recipe.title}
          </h2>
        </div>

        {!editMode && (
          <button
            className={classNames(
              "btn btn-outline btn-sm",
              project.status === RecipeProjectStatus.Soon && "!btn-accent"
            )}
          >
            View
          </button>
        )}
      </div>
      <p className="text-sm text-black line-clamp-3 dark:text-gray-300">
        {recipe.summary}
      </p>
      {((recipe.tags && recipe.tags.length > 0) || difference < 300000) && (
        <>
          <div className="flex-1" />
          <div className="space-x-2">
            {recipe?.tags?.map((tag) => {
              return (
                <span
                  className="badge badge-info p-2 py-3"
                  key={recipe.id + tag}
                >
                  {tag}
                </span>
              );
            })}
            {difference < 300000 && (
              <span className="badge badge-accent font-bold py-2">New</span>
            )}
          </div>
        </>
      )}
    </Link>
  );
}
