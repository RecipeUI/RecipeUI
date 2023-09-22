"use client";
import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { useState } from "react";
import {
  getConfigForSessionStore,
  getParametersForSessionStore,
} from "../../../state/apiSession";
import { FolderAPI } from "../../../state/apiSession/FolderAPI";
import { Modal } from "../../Modal";
import { v4 as uuidv4 } from "uuid";
import classNames from "classnames";

export function DuplicateModal({
  onClose,
  session,
  folderId,
}: {
  onClose: () => void;
  session: RecipeSession;
  folderId?: string;
}) {
  const [sessionName, setSessionName] = useState(
    (session.name || "New Session") + " copy"
  );
  const [isRecipeCopy, setIsRecipeCopy] = useState(false);

  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );
  const saveSession = useRecipeSessionStore((state) => state.saveEditorSession);

  const onSubmit = async () => {
    if (!sessionName) {
      alert("Please enter a session name");
      return;
    }

    saveSession().then(() => {
      const newSession: RecipeSession = addEditorSession({
        ...session,
        id: uuidv4(),
        name: sessionName,
        recipeId: isRecipeCopy ? session.recipeId : uuidv4(),
      });

      setTimeout(async () => {
        const parameters = await getParametersForSessionStore({
          session: session.id,
        });
        const config = await getConfigForSessionStore({
          recipeId: session.recipeId,
        });

        initializeEditorSession({
          currentSession: newSession,
          ...parameters,
          ...config,
        });

        if (folderId) {
          await FolderAPI.addSessionToFolder(newSession.id, folderId);
        }

        onClose();
      }, 0);
    });
  };

  return (
    <Modal header="Duplicate Request" onClose={onClose}>
      <div className="mt-4 flex flex-col space-y-2">
        <label>New Session Name</label>
        <input
          type="text"
          className="input input-bordered input-sm"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <label>Duplication Type</label>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <DuplicateCopyButton
            title="Simple Copy"
            description="The way copy normally works."
            selected={!isRecipeCopy}
            onClick={() => setIsRecipeCopy(false)}
          />
          <DuplicateCopyButton
            title="Linked Copy"
            description="Useful if you want to share the same TypeScript and Auth between two requests."
            selected={isRecipeCopy}
            onClick={() => setIsRecipeCopy(true)}
          />
        </div>
      </div>
      <button className="mt-4 btn btn-neutral" onClick={onSubmit}>
        Duplicate
      </button>
    </Modal>
  );
}

function DuplicateCopyButton({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className={classNames(
        "p-4 py-2 border rounded-md  flex items-start flex-col",
        selected && "!bg-accent border-none text-black"
      )}
      onClick={onClick}
    >
      <span className="font-bold text-sm">{title}</span>
      <p className="text-xs text-start">{description}</p>
    </button>
  );
}
