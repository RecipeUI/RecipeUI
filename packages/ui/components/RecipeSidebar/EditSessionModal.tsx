"use client";
import {
  RecipeSession,
  RecipeSessionFolder,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useEffect, useState } from "react";
import { FolderAPI, useSessionFolders } from "../../state/apiSession/FolderAPI";
import { Modal } from "../Modal";
import { CoreRecipeAPI } from "../../state/apiSession/RecipeAPI";

export function EditSessionModal({
  onClose,
  session,
}: {
  onClose: () => void;
  session: RecipeSession;
}) {
  const [name, setName] = useState(session.name);
  const folders = useSessionFolders();
  const updateSessionName = useRecipeSessionStore(
    (state) => state.updateSessionName
  );

  const [selectedFolder, setSelectedFolder] = useState("NO_FOLDER_ID");
  const [currentFolder, setCurrentFolder] =
    useState<RecipeSessionFolder | null>(null);

  useEffect(() => {
    const currentFolder = folders.find((folder) => {
      return folder.sessionIds.includes(session.id);
    });

    if (currentFolder) {
      setSelectedFolder(currentFolder.id);
      setCurrentFolder(currentFolder);
    }
  }, [folders]);

  const handleUpdateSessionName = async (e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateSessionName(session, name);

    if (currentFolder?.id !== selectedFolder) {
      if (folders.length > 0) {
        await FolderAPI.deleteSessionFromFolder(session.id);

        if (selectedFolder !== "NO_FOLDER_ID") {
          await FolderAPI.addSessionToFolder(session.id, selectedFolder);
        }
      }
    }

    onClose();
  };

  return (
    <Modal header="Edit Session" onClose={onClose}>
      <form onSubmit={(e)=> handleUpdateSessionName(e)}>
        <div className="mt-2 form-control">
          <label>Session Name</label>
          <input
            type="text"
            className="input input-bordered input-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdateSessionName(e);
              }
            }}
          />
        </div>

        {folders.length > 0 && (
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">Folder</span>
            </label>
            <select
              className="select select-bordered select-sm"
              value={selectedFolder}
              onChange={(e) => {
                setSelectedFolder(e.target.value);
              }}
            >
              {folders.map((folder) => {
                return (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                );
              })}
              <option value="NO_FOLDER_ID">No Folder</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-accent btn-sm mt-4">
          Submit
        </button>
      </form>
    </Modal>
  );
}
