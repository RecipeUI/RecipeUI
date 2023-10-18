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
import { RecipeAPI } from "../../RecipeAPI";
import {
  getConfigForSessionStore,
  setConfigForSessionStore,
} from "../../../state/apiSession";

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

  const setEditorHeader = useRecipeSessionStore(
    (state) => state.setEditorHeader
  );

  return (
    <Modal header="Edit Session" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (name) {
            updateSessionName(session, name);

            if (session.id === session.recipeId) {
              // Update recipe name too
              try {
                const config = await getConfigForSessionStore({
                  recipeId: session.recipeId,
                });

                const newEditorHeader = {
                  title: name,
                  description: config?.editorHeader.description || "",
                };

                await setConfigForSessionStore({
                  recipeId: session.recipeId,
                  config: {
                    ...config,
                    editorHeader: newEditorHeader,
                  },
                });
                setEditorHeader(newEditorHeader);
              } catch (e) {
                //
              }
            }
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
