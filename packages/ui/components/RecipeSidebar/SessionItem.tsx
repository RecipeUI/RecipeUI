"use client";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { useContext, useState } from "react";
import classNames from "classnames";
import {
  Cog6ToothIcon,
  FolderIcon,
  FolderOpenIcon,
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

import { RecipeSession } from "../../state/recipeSession";
import { useRef } from "react";
import { RouteTypeLabel } from "../RouteTypeLabel";
import { useHover } from "usehooks-ts";
import {
  DocumentDuplicateIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  eventEmitter,
  getConfigForSessionStore,
  getParametersForSessionStore,
} from "../../state/apiSession";
import { EditSessionModal } from "./Modal/EditSessionModal";
import { useSupabaseClient } from "../Providers/SupabaseProvider";
import { cloudEventEmitter } from "../../state/apiSession/CloudAPI";
import { DuplicateModal } from "./Modal/DuplicateModal";

interface SessionFolderProps {
  folder: RecipeSessionFolderExtended;
  isRootFolder?: boolean;
}

export function SessionFolder({ folder, isRootFolder }: SessionFolderProps) {
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

  const [open, setOpen] = useState(true);

  const Icon = open ? FolderOpenIcon : FolderIcon;

  return (
    <>
      <li className="w-full">
        <span
          className={classNames(
            " relative w-full text-xs font-bold p-0 px-2 py-2 pr-4 group",
            open && "menu-dropdown-show"
          )}
          onClick={(e) => {
            e.stopPropagation();

            setOpen(!open);
          }}
        >
          <span
            className={classNames(
              "flex items-center w-full",
              isCloudFolder && "text-blue-500 dark:text-accent"
            )}
          >
            {isCloudFolder ? (
              <Icon
                className={classNames(
                  "w-4 h-4 mr-2 mb-0.5",
                  isCloudFolder && "text-blue-500 dark:text-accent"
                )}
              />
            ) : (
              <Icon className="w-4 h-4 mr-2 mb-0.5" />
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
        </span>
        {open && (
          <ul className="">
            {folder.items.map((item) => {
              if (!item) return null;
              if (item.type === "session") {
                const session = item.session;

                return <SessionTab key={session.id} session={session} />;
              } else {
                const folder = item.folder;

                return <SessionFolder key={folder.id} folder={folder} />;
              }
            })}
          </ul>
        )}
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

interface SessionTabProps {
  session: RecipeSession;
}

export function SessionTab({ session }: SessionTabProps) {
  const recipeCloud = useContext(RecipeCloudContext);
  const cloudSession = recipeCloud.apiRecord[session.id];

  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const isCurrentSession = currentSession?.id === session.id;

  const hoverRef = useRef(null);
  const isHover = useHover(hoverRef);

  const closeSession = useRecipeSessionStore((state) => state.closeSession);

  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );
  const saveEditorSession = useRecipeSessionStore(
    (state) => state.saveEditorSession
  );

  const [duplicateModal, setDuplicateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const supabase = useSupabaseClient();

  return (
    <li>
      <div
        ref={hoverRef}
        key={session.id}
        className={classNames(
          "pl-4 py-2 text-xs",
          isCurrentSession && "bg-gray-400 dark:text-black"
        )}
        onClick={async (e) => {
          e.stopPropagation();
          e.preventDefault();

          if (isCurrentSession) return;

          saveEditorSession().then(async () => {
            const parameters = await getParametersForSessionStore({
              session: session.id,
            });
            const config = await getConfigForSessionStore({
              recipeId: session.recipeId,
            });

            initializeEditorSession({
              currentSession: session,
              ...parameters,
              ...config,
            });
          });
        }}
      >
        <div
          className={classNames(
            "text-start whitespace-pre-wrap relative group min-w-full ",
            cloudSession &&
              (isCurrentSession
                ? "text-blue-500 dark:text-neutral"
                : "text-blue-500  dark:text-accent")
          )}
        >
          <RouteTypeLabel size="small" recipeMethod={session.apiMethod} />
          <h4
            className={classNames(
              "ml-2 inline",
              isCurrentSession && "text-neutral group-hover:text-accent"
            )}
          >
            {session.name || "New Session"}
          </h4>
        </div>
        {isHover && (
          <div
            className="absolute cursor-pointer w-fit right-0 top-0 h-8 px-2 bg-base-100 border justify-center  flex  rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <label
              className="cursor-pointer flex justify-center items-center  h-full px-1 py-2.5 w-fit hover:bg-accent"
              onClick={() => {
                setShowEditModal(true);
              }}
            >
              <PencilSquareIcon className="w-3" />
            </label>
            <label
              className="cursor-pointer flex justify-center items-center  h-full px-1 py-2.5 w-fit hover:bg-accent"
              onClick={() => {
                setDuplicateModal(true);
              }}
            >
              <DocumentDuplicateIcon className="w-3" />
            </label>
            <label
              className="cursor-pointer flex justify-center items-center  h-full px-1 py-2.5 w-fit hover:bg-accent rounded-r-md"
              onClick={async (e) => {
                e.stopPropagation();

                const confirm = await window.confirm(
                  cloudSession
                    ? "Are you sure you want to permanently delete this API from the cloud and collection?"
                    : "Are you sure you want to delete this session?"
                );
                if (!confirm) return;

                if (cloudSession) {
                  await supabase.from("recipe").delete().match({
                    id: cloudSession.id,
                  });
                }

                const nextSession = closeSession(session);

                setTimeout(async () => {
                  await FolderAPI.deleteSessionFromFolder(session.id);
                  cloudEventEmitter.emit("refreshCloud");

                  setTimeout(() => {
                    eventEmitter.emit("refreshSidebar");
                  }, 0);

                  // This a bit bugger so temporarily disable
                  // if (nextSession) {
                  //   const parameters = await getParametersForSessionStore({
                  //     session: nextSession.id,
                  //   });
                  //   const config = await getConfigForSessionStore({
                  //     recipeId: nextSession.recipeId,
                  //   });
                  //   initializeEditorSession({
                  //     currentSession: nextSession,
                  //     ...parameters,
                  //     ...config,
                  //   });
                  // }
                }, 0);
              }}
            >
              <TrashIcon className="w-3" />
            </label>
          </div>
        )}
      </div>
      {duplicateModal && (
        <DuplicateModal
          onClose={() => setDuplicateModal(false)}
          session={session}
        />
      )}
      {showEditModal && (
        <EditSessionModal
          onClose={() => setShowEditModal(false)}
          session={session}
        />
      )}
    </li>
  );
}
