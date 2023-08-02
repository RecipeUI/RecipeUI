import classNames from "classnames";
import { useRecipeSessionStore } from "../../state/recipeSession";

export function RecipeSidebar() {
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  if (!currentSession) return null;

  return (
    <div className="w-52 border-r">
      <h3 className="font-bold text-sm m-4">Sessions</h3>
      <div>
        {sessions.map((session) => {
          const isCurrentSession = currentSession.id === session.id;

          return (
            <button
              key={session.id}
              className={classNames(
                "px-4 py-2 text-sm w-full text-start relative",
                isCurrentSession && "bg-gray-400 text-white"
              )}
              onClick={() => setCurrentSession(session)}
            >
              <h4 className="">{session.name}</h4>
              {isCurrentSession && (
                <div className="absolute top-0 left-0 bottom-0 bg-gray-600 w-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
