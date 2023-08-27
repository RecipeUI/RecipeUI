"use client";

import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import classNames from "classnames";
import { getURLParamsForSession } from "../../utils/main";
import { RouteTypeLabel } from "../RouteTypeLabel";
import { useHover } from "usehooks-ts";
import { useIsMobile } from "../../hooks";
import { PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { RecipeHomeSidebar } from "./RecipeHomeSidebar";
import { useIsTauri } from "../../hooks/useIsTauri";
import {
  getConfigForSessionStore,
  getParametersForSessionStore,
  getSessionsFromStore,
  saveSessionToStore,
} from "../../state/apiSession";

export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const setSessions = useRecipeSessionStore((state) => state.setSessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;

    saveSessionToStore(sessions);
  }, [loaded, sessions, setSessions]);

  useEffect(() => {
    getSessionsFromStore().then((sessions) => {
      setSessions(sessions || []);
      setLoaded(true);
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
            setCurrentSession(null, false);
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
        {sessions.length >= 10 && (
          <div className="px-4 py-2 text-xs w-full text-start relative flex bg-warning dark:text-black animate-pulse">
            Having 10 or more sessions is not recommended. Consider closing some
            and take advantage of recipes instead.
          </div>
        )}

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

  return (
    <button
      ref={hoverRef}
      key={session.id}
      className={classNames(
        "px-4 py-2 text-xs w-full text-start relative flex",
        isCurrentSession && "bg-gray-400 text-white"
      )}
      onClick={async () => {
        if (!isCurrentSession) {
          const parameters = await getParametersForSessionStore(session.id);
          const config = await getConfigForSessionStore(session.id);

          initializeEditorSession({
            currentSession: session,
            ...parameters,
            ...config,
          });

          return;
        }

        if (!isEditing) {
          setIsEditing(true);
          return;
        }
      }}
    >
      <RouteTypeLabel size="small" recipeMethod={session.apiMethod} />
      {isEditing ? (
        <input
          className="text-black outline-none ml-2 dark:text-white dark:bg-neutral-900 w-full"
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
      {isCurrentSession && (
        <div className="absolute top-0 left-0 bottom-0 bg-gray-600 w-1" />
      )}
      {isHover && !isEditing && (
        <div
          className="absolute right-0 top-0 bottom-0 flex w-8 justify-center items-center  hover:bg-red-600 hover:text-white cursor-pointer"
          onClick={async (e) => {
            e.stopPropagation();
            const nextSession = closeSession(session);

            if (nextSession) {
              const parameters = await getParametersForSessionStore(session.id);
              const config = await getConfigForSessionStore(session.id);

              initializeEditorSession({
                currentSession: nextSession,
                ...parameters,
                ...config,
              });
            }
          }}
        >
          <XMarkIcon className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}
