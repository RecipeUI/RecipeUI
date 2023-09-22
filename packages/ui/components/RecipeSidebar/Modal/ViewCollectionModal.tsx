"use client";
import {
  DesktopPage,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { useState } from "react";
import { Modal } from "../../Modal";
import { isUUID } from "utils";
import { RecipeProject } from "types/database";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import { fetchProjectById } from "../../../fetchers/project";

export function ViewCollectionModal({ onClose }: { onClose: () => void }) {
  const [collectionUrl, setCollectionUrl] = useState("");
  const supabase = useSupabaseClient();
  const [project, setProject] = useState<null | RecipeProject>(null);

  const onPreview = async () => {
    const collectionId = collectionUrl.split("/").pop();

    if (!collectionId || !isUUID(collectionId)) {
      alert("Invalid collection URL");
      return;
    }

    const { project } = await fetchProjectById({
      projectId: collectionId,
      supabase,
      projectOnly: true,
    });

    setProject(project);
  };

  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  return (
    <Modal header="Import Collection" onClose={onClose}>
      <p className="text-sm">
        Found a collection someone made online? Import it here
      </p>
      <div className="space-y-2">
        <input
          type="text"
          className="input input-bordered input-sm mt-2 w-full"
          value={collectionUrl}
          onChange={(e) => setCollectionUrl(e.target.value)}
        />
        <button className="btn btn-sm btn-neutral" onClick={onPreview}>
          Preview
        </button>
      </div>
      {project && (
        <div className="border rounded-md p-4 mt-4">
          <h2 className="font-bold">{project.title}</h2>
          <p className="text-sm">{project.description}</p>
          <a
            className="btn btn-accent btn-xs mt-2"
            href={`/${project.id}`}
            onClick={(e) => {
              if (isTauri) {
                e.preventDefault();
                setDesktopPage({
                  page: DesktopPage.Project,
                  pageParam: project.id,
                });
              }
            }}
          >
            View Collection
          </a>
        </div>
      )}
    </Modal>
  );
}
