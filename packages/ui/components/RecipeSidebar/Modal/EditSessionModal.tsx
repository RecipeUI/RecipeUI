"use client";
import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { useEffect, useState } from "react";
import {
  FolderAPI,
  useSessionFolders,
} from "../../../state/apiSession/FolderAPI";
import { Modal } from "../../Modal";
import { CoreRecipeAPI } from "../../../state/apiSession/RecipeAPI";
import { RecipeSessionFolder } from "types/database";

export function EditSessionModal({
  onClose,
  session,
}: {
  onClose: () => void;
  session: RecipeSession;
}) {
  const [name, setName] = useState(session.name);
  const updateSessionName = useRecipeSessionStore(
    (state) => state.updateSessionName
  );

  return (
    <Modal header="Edit Session" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (name) {
            updateSessionName(session, name);
          }

          onClose();
        }}
      >
        <div className="mt-2 form-control">
          <label>Session Name</label>
          <input
            type="text"
            className="input input-bordered input-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-accent btn-sm mt-4">
          Submit
        </button>
      </form>
    </Modal>
  );
}
