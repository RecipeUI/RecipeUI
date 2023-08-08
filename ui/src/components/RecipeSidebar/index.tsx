"use client";

import classNames from "classnames";
import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useEffect, useRef, useState } from "react";
import { useHover } from "usehooks-ts";
import { PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { RouteTypeLabel } from "../RouteTypeLabel";
import { useParams, usePathname, useRouter } from "next/navigation";

export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (
          ["ArrowDown", "ArrowUp"].includes(event.key) &&
          sessions.length > 1
        ) {
          event.preventDefault();

          router.push("/");

          if (!currentSession) return setCurrentSession(sessions[0]);

          const currentIndex = sessions.findIndex(
            (session) => session.id === currentSession.id
          );

          const changeFactor = event.key === "ArrowDown" ? 1 : -1;
          const nextIndex = (currentIndex + changeFactor) % sessions.length;

          const nextSession = sessions[nextIndex];
          router.push(`/?s=${nextSession.id}`);
          setCurrentSession(sessions[nextIndex]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentSession, sessions, setCurrentSession]);

  const pathname = usePathname();
  const { project: projectId } = useParams();
  useEffect(() => {
    if (!projectId && sessions.length === 0 && pathname !== "/")
      router.push("/");
  }, [sessions.length]);

  if (sessions.length === 0) return null;

  return (
    <div className="hidden sm:block w-56 border-r">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm ml-4 ">Sessions</h3>
        <button
          className="hover:bg-blue-600 dark:hover:bg-blue-900 px-4 py-3 tooltip tooltip-bottom"
          data-tip="Add a new session (CMD+K)"
          onClick={() => {
            router.push("/");
            setCurrentSession(null);
          }}
        >
          <PlusCircleIcon className="w-4 h-4" />
        </button>
      </div>
      <div>
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
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );
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
  const router = useRouter();

  return (
    <button
      ref={hoverRef}
      key={session.id}
      className={classNames(
        "px-4 py-2 text-xs w-full text-start relative flex",
        isCurrentSession && "bg-gray-400 text-white"
      )}
      onClick={() => {
        if (!isCurrentSession) {
          router.push(`/?s=${session.id}`);
          setCurrentSession(session);
          return;
        }
        if (!isEditing) {
          setIsEditing(true);
          return;
        }
      }}
    >
      <RouteTypeLabel size="small" recipeMethod={session.recipe.method} />
      {isEditing ? (
        <input
          className="text-black outline-none ml-2 dark:text-white dark:bg-neutral-900"
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
          onClick={(e) => {
            e.stopPropagation();
            closeSession(session);
          }}
        >
          <XMarkIcon className="w-4 h-4" />
        </div>
      )}
    </button>
  );
}
