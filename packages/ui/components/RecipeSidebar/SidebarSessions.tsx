import { useRecipeSessionStore } from "../../state/recipeSession";
import { useSessionFolders } from "../../state/apiSession/FolderAPI";

import { RecipeSession } from "types/database";
import {
  RecipeCloudContext,
  useRecipeCloud,
} from "../../state/apiSession/CloudAPI";
import { SessionTab } from "./SessionTab";
import { SessionFolder } from "./SessionFolder";

export function SidebarSessions() {
  const { rootFolderSessionsExtended, noFolderSessions } = useSessionFolders();
  const recipeCloud = useRecipeCloud();

  return (
    <RecipeCloudContext.Provider value={recipeCloud}>
      <ul className="menu py-0">
        {rootFolderSessionsExtended.map((folder) => {
          return <SessionFolder key={folder.id} folder={folder} isRootFolder />;
        })}
      </ul>
      <NoFolderSessions
        sessions={noFolderSessions}
        hasFolders={rootFolderSessionsExtended.length !== 0}
      />
    </RecipeCloudContext.Provider>
  );
}

const NoFolderSessions = ({
  sessions,
  hasFolders,
}: {
  sessions: RecipeSession[];
  hasFolders: boolean;
}) => {
  const setSessions = useRecipeSessionStore((state) => state.setSessions);

  return (
    <div>
      <div className="text-start py-2 w-full">
        <h3 className="font-bold text-xs ml-4">
          {hasFolders ? "No Folder" : "Sessions"}
        </h3>
      </div>
      <ul className="menu py-0 w-full">
        {sessions.map((session) => (
          <SessionTab key={session.id} session={session} />
        ))}
      </ul>
    </div>
  );
};
