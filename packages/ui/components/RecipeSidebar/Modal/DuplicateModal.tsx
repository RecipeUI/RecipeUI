"use client";
import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { FormEventHandler, useState } from "react";
import {
  getConfigForSessionStore,
  getParametersForSessionStore,
} from "../../../state/apiSession";
import { FolderAPI } from "../../../state/apiSession/FolderAPI";
import { Modal } from "../../Modal";
import { v4 as uuidv4 } from "uuid";
import classNames from "classnames";
import { SecretAPI } from "../../../state/apiSession/SecretAPI";
import { RecipeAuthType } from "types/enums";
import { AuthConfig, SingleAuthConfig } from "types/database";

export function DuplicateModal({
  onClose,
  session,
}: {
  onClose: () => void;
  session: RecipeSession;
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

  const onSubmit = () => {
    if (!sessionName) {
      alert("Please enter a session name");
      return;
    }

    saveSession().then(async () => {
      const newSessionId = uuidv4();

      const newSession: RecipeSession = addEditorSession({
        ...session,
        id: newSessionId,
        name: sessionName,
        recipeId: isRecipeCopy ? session.recipeId : newSessionId,
      });

      setTimeout(async () => {
        const parameters = await getParametersForSessionStore({
          session: session.id,
        });

        const config = await getConfigForSessionStore({
          recipeId: session.recipeId,
        });

        // Clone auth API key
        if (config && config.editorAuthConfig) {
          if (config.editorAuthConfig.type !== RecipeAuthType.Multiple) {
            const primaryToken = await SecretAPI.getSecret({
              secretId: session.recipeId,
              index: undefined, // will modify once multiple is implemented
            });

            if (primaryToken) {
              await SecretAPI.saveSecret({
                secretId: newSession.recipeId,
                secretValue: primaryToken,
              });
            }
          } else {
            // TODO: Clone multiple API Keys
            // let authConfigs: SingleAuthConfig[] =
            //   config.editorAuthConfig.type === RecipeAuthType.Multiple
            //     ? config.editorAuthConfig.payload
            //     : [config.editorAuthConfig];
          }
        }

        initializeEditorSession({
          currentSession: newSession,
          ...parameters,
          ...config,
        });

        const parentFolder = await FolderAPI.getParentFolder(session.id);
        if (parentFolder?.id) {
          await FolderAPI.addSessionToFolder(newSession.id, parentFolder.id);
        }

        onClose();
      }, 0);
    });
  };

  return (
    <Modal header="Duplicate Request" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
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
        <button type="submit" className="mt-4 btn btn-neutral">
          Duplicate
        </button>
      </form>
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
