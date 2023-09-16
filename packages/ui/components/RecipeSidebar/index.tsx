"use client";

import {
  RecipeSession,
  RecipeSessionFolder,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import { RouteTypeLabel } from "../RouteTypeLabel";
import { useHover, useSessionStorage } from "usehooks-ts";
import {
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  getConfigForSessionStore,
  getParametersForSessionStore,
  getSessionsFromStore,
  saveSessionToStore,
} from "../../state/apiSession";
import { FolderAPI, useSessionFolders } from "../../state/apiSession/FolderAPI";
import { Modal } from "../Modal";
import { v4 as uuidv4 } from "uuid";
import { RECIPE_FORKING_ID } from "../../utils/constants/main";
import { useForm } from "react-hook-form";
import { CurlModal } from "../../pages/editor/Builders/CurlModal";
import { useInitializeRecipe } from "../../hooks/useInitializeRecipe";
import { PublishFolderModal } from "../../pages/editor/Builders/PublishModal";

interface FolderToSessions {
  [folderId: string]: {
    folder: RecipeSessionFolder;
    sessions: RecipeSession[];
  };
}

export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const setSessions = useRecipeSessionStore((state) => state.setSessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;

    saveSessionToStore(sessions);
  }, [loaded, sessions, setSessions]);

  const [recipeFork, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");

  const [curlModal, setCurlModal] = useState(false);

  const { initializeRecipe } = useInitializeRecipe();

  useEffect(() => {
    // The only place we initialize forks from collections
    async function initialize() {
      if (!recipeFork) return;

      let [forkId, recipeTitle] = recipeFork.split("::");

      setRecipeFork("");
      initializeRecipe(forkId, recipeTitle);
    }

    getSessionsFromStore().then(async (sessions) => {
      setSessions(sessions || []);
      setLoaded(true);

      initialize();
    });
  }, [setSessions]);

  const [addFolderModal, setAddFolderModal] = useState(false);
  const [editFolder, setEditFolder] = useState<RecipeSessionFolder | null>(
    null
  );
  const [publishFolder, setPublishFolder] =
    useState<RecipeSessionFolder | null>(null);

  const folders = useSessionFolders();

  const { folderSessions, noFolderSessions } = useMemo(() => {
    const sessionRecord: Record<string, RecipeSession> = {};
    for (const session of sessions) {
      sessionRecord[session.id] = session;
    }

    const folderSessions: FolderToSessions = {};

    for (const folder of folders) {
      folderSessions[folder.id] = {
        folder,
        sessions: folder.sessionIds.map((sessionId) => {
          const session = sessionRecord[sessionId];

          delete sessionRecord[sessionId];

          return session;
        }),
      };
    }

    const noFolderSessions: RecipeSession[] = Object.values(sessionRecord);

    return {
      folderSessions,
      noFolderSessions,
    };
  }, [folders, sessions]);

  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:block w-60 border-r border-r-slate-200 dark:border-r-slate-600 overflow-x-clip overflow-y-auto">
      <div className="dropdown cursor-pointer w-full right-0 text-start border-b border-recipe-slate mb-2">
        <label
          tabIndex={0}
          className="cursor-pointer flex justify-start items-center  h-full px-2 text-xs text-start ml-2 py-4 font-bold"
        >
          New
          <PlusCircleIcon className="w-3 h-3 ml-1" />
        </label>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content  shadow z-10  rounded-lg bg-white dark:bg-slate-600 w-fit border left-2 top-8 text-end text-sm dark:text-white text-black"
          onClick={(e) => {
            // @ts-expect-error Need to get blur
            e.target.parentNode?.parentNode?.blur();

            setTimeout(() => {
              document.getElementById("url-input")?.focus();
            }, 500);
          }}
        >
          <li>
            <button
              onClick={(e) => {
                addEditorSession();
              }}
            >
              Request
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setCurlModal(true);
              }}
            >
              Import from cURL
            </button>
          </li>
          <li className="">
            <button
              className=""
              onClick={() => {
                setAddFolderModal(true);
              }}
            >
              Folder
            </button>
          </li>
        </ul>
      </div>

      {Object.keys(folderSessions).length > 0 && (
        <ul className="menu py-0">
          {Object.keys(folderSessions).map((folderId) => {
            const { folder, sessions } = folderSessions[folderId];

            return (
              <li key={folderId}>
                <details className="relative group" open>
                  <summary className="text-xs font-bold p-0 px-2 py-2 pr-4  w-full">
                    {folder.name}
                    <div className="flex space-x-2">
                      <a
                        className="hidden group-hover:block hover:animate-spin w-fit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          setEditFolder(folder);
                        }}
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                      </a>
                      <a
                        className="hidden group-hover:block hover:bg-primary w-fit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          const session = addEditorSession();
                          FolderAPI.addSessionToFolder(session.id, folder.id);
                        }}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </a>
                      <a
                        className="hidden group-hover:block hover:bg-primary w-fit"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          setPublishFolder(folder);
                        }}
                      >
                        <ShareIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </summary>
                  <ul>
                    {sessions.map((session) => {
                      if (!session) return null;

                      const isCurrentSession =
                        currentSession?.id === session.id;

                      return (
                        <SessionTab
                          key={session.id}
                          session={session}
                          isCurrentSession={isCurrentSession}
                          folderId={folderId}
                        />
                      );
                    })}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {/* This is the base folder. It has no names. No indentation */}
      {noFolderSessions.length > 0 && (
        <div>
          <div className="text-start py-2 w-full">
            <h3 className="font-bold text-xs ml-4">
              {Object.keys(folderSessions).length !== 0
                ? "No Folder"
                : "Sessions"}
            </h3>
          </div>
          <ul className="menu py-0">
            {noFolderSessions.map((session) => {
              const isCurrentSession = currentSession?.id === session.id;

              return (
                <SessionTab
                  key={session.id}
                  session={session}
                  isCurrentSession={isCurrentSession}
                />
              );
            })}
          </ul>
        </div>
      )}
      {addFolderModal && (
        <FolderModal onClose={() => setAddFolderModal(false)} />
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
      {curlModal && <CurlModal onClose={() => setCurlModal(false)} />}
    </div>
  );
}

function FolderModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit } = useForm<{ folderName: string }>({
    defaultValues: {},
  });

  const onSubmit = handleSubmit((data) => {
    FolderAPI.addFolder(data.folderName);
    onClose();
  });

  return (
    <Modal header="New Folder" onClose={onClose} size="sm">
      <form className="mt-1 flex flex-col space-y-2" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Folder Name"
          className="input input-bordered input-sm"
          {...register("folderName", {
            required: true,
          })}
        />
        <button className="mt-4 btn btn-neutral w-fit btn-sm" type="submit">
          Create
        </button>
      </form>
    </Modal>
  );
}

function EditFolderModal({
  onClose,
  folder,
}: {
  onClose: () => void;
  folder: RecipeSessionFolder;
}) {
  const closeSessions = useRecipeSessionStore((state) => state.closeSessions);
  const { register, handleSubmit } = useForm<{
    folderName: string;
    deleteAll: boolean;
  }>({
    defaultValues: {
      folderName: folder.name,
    },
  });

  const [deleteAll, setDeleteAll] = useState(true);

  const onSubmit = handleSubmit(async (data) => {
    await FolderAPI.editFolderName(folder.id, data.folderName);

    onClose();
  });

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
            <p>Delete folder</p>
            <div className="flex items-center space-x-2 text-sm">
              <input
                className="checkbox checkbox-sm"
                type="checkbox"
                checked={deleteAll}
                onChange={(e) => setDeleteAll(e.target.checked)}
              />
              <label>Delete all sessions inside the folder.</label>
            </div>
          </div>

          <button
            className="btn btn-error w-fit btn-sm mt-4"
            onClick={async () => {
              const confirm = await window.confirm(
                "Are you sure you want to delete this folder?"
              );

              if (confirm) {
                await FolderAPI.removeFolder(folder.id);

                if (deleteAll) {
                  const sessionIds = [...folder.sessionIds];
                  closeSessions(sessionIds);
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

function SessionTab({
  isCurrentSession,
  session,
  folderId,
}: {
  isCurrentSession: boolean;
  session: RecipeSession;
  folderId?: string;
}) {
  const hoverRef = useRef(null);
  const isHover = useHover(hoverRef);

  const updateSessionName = useRecipeSessionStore(
    (state) => state.updateSessionName
  );
  const closeSession = useRecipeSessionStore((state) => state.closeSession);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session.name);

  const onUpdateSessionName = () => {
    setIsEditing(false);
    updateSessionName(session, name);
  };
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );
  const saveEditorSession = useRecipeSessionStore(
    (state) => state.saveEditorSession
  );

  const [duplicateModal, setDuplicateModal] = useState<null | {
    folder_id?: string;
  }>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <li className="relative cursor-pointer">
      <div
        ref={hoverRef}
        key={session.id}
        className={classNames(
          "pl-4 py-2 text-xs ",
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
        <div className="text-start whitespace-pre-wrap">
          {!isEditing && (
            <RouteTypeLabel size="small" recipeMethod={session.apiMethod} />
          )}
          {isEditing ? (
            <input
              className="text-black outline-none ml-2 dark:text-white dark:bg-neutral-900 flex-1 mr-4 inline"
              onBlur={onUpdateSessionName}
              onKeyDown={(e) => {
                if (e.key === "Enter") onUpdateSessionName();
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
          ) : (
            <h4 className="ml-2 inline">{session.name || "New Session"}</h4>
          )}
        </div>
        {isHover && !isEditing && (
          <div
            className="absolute cursor-pointer w-fit  right-0 top-0 bottom-0 bg-accent justify-center text-white flex h-fit rounded-r-md"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <label
              className="cursor-pointer flex justify-center items-center  h-full px-1 py-2.5 w-fit hover:bg-primary"
              onClick={() => {
                setShowEditModal(true);
              }}
            >
              <PencilSquareIcon className="w-3" />
            </label>
            <label
              className="cursor-pointer flex justify-center items-center  h-full px-1 py-2.5 w-fit hover:bg-primary"
              onClick={() => {
                setDuplicateModal({ folder_id: folderId });
              }}
            >
              <DocumentDuplicateIcon className="w-3" />
            </label>
            <label
              className="cursor-pointer flex justify-center items-center  h-full px-1 py-2.5 w-fit hover:bg-primary rounded-r-md"
              onClick={async (e) => {
                e.stopPropagation();

                const confirm = await window.confirm(
                  "Are you sure you want to delete this session?"
                );
                if (!confirm) return;

                const nextSession = closeSession(session);

                setTimeout(async () => {
                  await FolderAPI.deleteSessionFromFolder(session.id);
                  if (nextSession) {
                    const parameters = await getParametersForSessionStore({
                      session: nextSession.id,
                    });
                    const config = await getConfigForSessionStore({
                      recipeId: nextSession.recipeId,
                    });

                    initializeEditorSession({
                      currentSession: nextSession,
                      ...parameters,
                      ...config,
                    });
                  }
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
          folderId={duplicateModal.folder_id}
          onClose={() => setDuplicateModal(null)}
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

function EditSessionModal({
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

  return (
    <Modal header="Edit Session" onClose={onClose}>
      <form
        onSubmit={async () => {
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

function DuplicateModal({
  onClose,
  session,
  folderId,
}: {
  onClose: () => void;
  session: RecipeSession;
  folderId?: string;
}) {
  const [sessionName, setSessionName] = useState(session.name + " copy");
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
        <label>Session Name</label>
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
