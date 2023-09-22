"use client";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { useContext, useState } from "react";
import classNames from "classnames";
import {
  Cog6ToothIcon,
  FolderIcon,
  FolderPlusIcon,
  PlusCircleIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { FolderAPI } from "../../state/apiSession/FolderAPI";
import { PublishFolderModal } from "../../pages/editor/Builders/PublishModal";
import { RecipeSessionFolderExtended } from "types/database";
import { RecipeCloudContext } from "../../state/apiSession/CloudAPI";
import { FolderModal } from "./Modal/FolderModal";
import { EditFolderModal } from "./Modal/EditFolderModal";
import { SessionTab } from "./SessionTab";

export function SessionFolder({
  folder,
  isRootFolder,
}: {
  folder: RecipeSessionFolderExtended;
  isRootFolder?: boolean;
}) {
  const recipeCloud = useContext(RecipeCloudContext);
  const isCloudFolder =
    recipeCloud.collectionRecord[folder.id] ??
    !!recipeCloud.folderToCollection[folder.id];

  const [editFolder, setEditFolder] =
    useState<RecipeSessionFolderExtended | null>(null);
  const [publishFolder, setPublishFolder] =
    useState<RecipeSessionFolderExtended | null>(null);
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );
  const [addFolderModal, setAddFolderModal] = useState(false);

  return (
    <>
      <li className="w-full">
        <details className="relative w-full" open>
          <summary className="text-xs font-bold p-0 px-2 py-2 pr-4  w-full group">
            <span
              className={classNames(
                "flex items-center w-full",
                isCloudFolder && "text-blue-500 dark:text-accent"
              )}
            >
              {isCloudFolder ? (
                <FolderIcon
                  className={classNames(
                    "w-4 h-4 mr-2 mb-0.5",
                    isCloudFolder && "text-blue-500 dark:text-accent"
                  )}
                />
              ) : (
                <FolderIcon className="w-4 h-4 mr-2 mb-0.5" />
              )}

              {folder.name}
            </span>
            <div className="hidden absolute right-0 group-hover:flex z-10 bg-base-100 top-0 h-8 px-2 items-center group-hover:border rounded-md">
              <a
                className="hidden group-hover:block hover:animate-spin w-fit py-2 px-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setEditFolder(folder);
                }}
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </a>
              <a
                className="hidden group-hover:block hover:bg-accent w-fit py-2 px-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const session = addEditorSession();
                  FolderAPI.addSessionToFolder(session.id, folder.id);
                }}
              >
                <PlusCircleIcon className="w-4 h-4" />
              </a>
              <a
                className="hidden group-hover:block hover:bg-accent w-fit py-2 px-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setAddFolderModal(true);
                }}
              >
                <FolderPlusIcon className="w-4 h-4" />
              </a>
              {isRootFolder && (
                <a
                  className="hidden group-hover:block hover:bg-accent w-fit py-2 px-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setPublishFolder(folder);
                  }}
                >
                  <ShareIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </summary>
          <ul>
            {folder.items.map((item) => {
              if (!item) return null;
              if (item.type === "session") {
                const session = item.session;

                return (
                  <SessionTab
                    key={session.id}
                    session={session}
                    cloudSession={recipeCloud.apiRecord[session.id]}
                    parentFolderId={folder.id}
                  />
                );
              } else {
                const folder = item.folder;

                return <SessionFolder key={folder.id} folder={folder} />;
              }
            })}
          </ul>
        </details>
      </li>
      {addFolderModal && (
        <FolderModal
          onClose={() => setAddFolderModal(false)}
          addToFolder={folder}
        />
      )}
      {editFolder && (
        <EditFolderModal
          onClose={() => setEditFolder(null)}
          folder={editFolder}
        />
      )}
      {publishFolder && (
        <PublishFolderModal
          onClose={() => setPublishFolder(null)}
          folder={publishFolder}
        />
      )}
    </>
  );
}
