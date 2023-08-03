import classNames from "classnames";
import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useRef, useState } from "react";
import { useHover } from "usehooks-ts";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { RouteTypeLabel } from "../RouteTypeLabel";

export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  if (!currentSession) return null;

  return (
    <div className="hidden sm:block w-56 border-r">
      <h3 className="font-bold text-sm my-4 mx-4">Sessions</h3>
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
          className="text-black outline-none ml-2"
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
