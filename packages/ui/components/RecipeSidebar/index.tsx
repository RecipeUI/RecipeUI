"use client";

import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import {} from "../../utils/main";
import { RouteTypeLabel } from "../RouteTypeLabel";
import { useHover, useSessionStorage } from "usehooks-ts";
import { Cog6ToothIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import {
  getConfigForSessionStore,
  getParametersForSessionStore,
  getSessionsFromStore,
  saveSessionToStore,
} from "../../state/apiSession";
import { Modal } from "../Modal";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "next/navigation";
import { RECIPE_FORKING_ID } from "../../utils/constants/main";

export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const setSessions = useRecipeSessionStore((state) => state.setSessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;

    saveSessionToStore(sessions);
  }, [loaded, sessions, setSessions]);

  const [recipeFork, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");

  useEffect(() => {
    async function initialize() {
      if (recipeFork) {
        setRecipeFork("");

        const sessionConfig = await getConfigForSessionStore({
          recipeId: recipeFork,
        });

        if (sessionConfig) {
          initializeEditorSession({
            currentSession: {
              id: uuidv4(),
              name: sessionConfig.editorHeader.title,
              apiMethod: sessionConfig.editorMethod,
              recipeId: recipeFork,
            },
            ...sessionConfig,
          });
        }
      }
    }

    getSessionsFromStore().then(async (sessions) => {
      setSessions(sessions || []);
      setLoaded(true);

      initialize();
    });
  }, [setSessions]);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:block w-52 border-r border-r-slate-200 dark:border-r-slate-600 pt-2">
      {currentSession !== null && (
        <button
          className="text-start py-2 px-4 w-full"
          onClick={() => {
            setCurrentSession(null, true);
          }}
        >
          <h3 className="font-bold text-xs cursor-pointer p-0 text-start flex justify-between">
            <span>Add Request</span>
            <PlusCircleIcon className="w-4 h-4" />
          </h3>
        </button>
      )}
      <div className="text-start py-2 w-full">
        <h3 className="font-bold text-xs ml-4">Sessions</h3>
      </div>
      <div>
        {/* {sessions.length >= 10 && (
          <div className="px-4 py-2 text-xs w-full text-start relative flex bg-warning dark:text-black animate-pulse">
            Having 10 or more sessions is not recommended. Consider closing some
            and take advantage of recipes instead.
          </div>
        )} */}

        {sessions.map((session) => {
          const isCurrentSession = currentSession?.id === session.id;

          return (
            <SessionTab
              key={session.id}
              session={session}
              isCurrentSession={isCurrentSession}
            />
          );
        })}
      </div>
    </div>
  );
}

function SessionTab({
  isCurrentSession,
  session,
}: {
  isCurrentSession: boolean;
  session: RecipeSession;
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

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  return (
    <>
      <button
        ref={hoverRef}
        key={session.id}
        className={classNames(
          "pl-4 py-2 text-xs w-full text-start relative flex overflow-x-clip",
          isCurrentSession && "bg-gray-400 text-white"
        )}
        onClick={async () => {
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
        {!isEditing && (
          <RouteTypeLabel size="small" recipeMethod={session.apiMethod} />
        )}
        {isEditing ? (
          <input
            className="text-black outline-none ml-2 dark:text-white dark:bg-neutral-900 flex-1 mr-4"
            onBlur={onUpdateSessionName}
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdateSessionName();
            }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <h4 className="ml-2">{session.name}</h4>
        )}

        {isHover && !isEditing && (
          <div
            className="absolute dropdown cursor-pointer w-fit right-0 z-40 top-0 bottom-0 bg-black justify-center text-white"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <label
              tabIndex={0}
              className="cursor-pointer flex justify-center items-center  h-full px-2"
            >
              <Cog6ToothIcon className="w-4 h-4 " />
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content z-40  shadow  rounded-lg bg-base-300 w-fit border right-0 top-8 text-end text-sm dark:text-white text-black"
            >
              <li>
                <a
                  onClick={() => {
                    setShowDuplicateModal(true);
                  }}
                >
                  Duplicate
                </a>
              </li>
              <li className="">
                <a
                  className=""
                  onClick={() => {
                    setIsEditing(true);
                  }}
                >
                  Edit
                </a>
              </li>
              <li>
                <a
                  className=""
                  onClick={async (e) => {
                    e.stopPropagation();
                    const nextSession = closeSession(session);

                    setTimeout(async () => {
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
                  <span className="">Close</span>
                </a>
              </li>
            </ul>
          </div>
        )}
      </button>
      {showDuplicateModal && (
        <DuplicateModal
          onClose={() => setShowDuplicateModal(false)}
          session={session}
        />
      )}
    </>
  );
}

function DuplicateModal({
  onClose,
  session,
}: {
  onClose: () => void;
  session: RecipeSession;
}) {
  const [sessionName, setSessionName] = useState(session.name + " copy");
  const [isRecipeCopy, setIsRecipeCopy] = useState(true);

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

        onClose();
      }, 0);
    });
  };

  return (
    <Modal header="Duplicate Modal" onClose={onClose}>
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
            title="Deep Copy"
            description="Simple hard copy of all parameters and documentation."
            selected={!isRecipeCopy}
            onClick={() => setIsRecipeCopy(false)}
          />
          <DuplicateCopyButton
            title="Recipe Copy"
            description="Link the types, auth, and documentation with this API."
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
