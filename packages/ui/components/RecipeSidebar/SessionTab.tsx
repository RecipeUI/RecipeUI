"use client";
import {
  RecipeSession,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useRef, useState } from "react";
import classNames from "classnames";
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
import { FolderAPI } from "../../state/apiSession/FolderAPI";
import { EditSessionModal } from "./Modal/EditSessionModal";
import { Recipe } from "types/database";
import { useSupabaseClient } from "../Providers/SupabaseProvider";
import { cloudEventEmitter } from "../../state/apiSession/CloudAPI";
import { DuplicateModal } from "./Modal/DuplicateModal";

export function SessionTab({
  session,
  cloudSession,
  parentFolderId,
}: {
  session: RecipeSession;
  cloudSession?: Recipe;
  parentFolderId?: string;
}) {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const isCurrentSession = currentSession?.id === session.id;

  const hoverRef = useRef(null);
  const isHover = useHover(hoverRef);

  const updateSessionName = useRecipeSessionStore(
    (state) => state.updateSessionName
  );
  const closeSession = useRecipeSessionStore((state) => state.closeSession);

  const [name, setName] = useState(session.name);

  const onUpdateSessionName = () => {
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

  const supabase = useSupabaseClient();

  return (
    <li className={classNames("relative cursor-pointer")}>
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
                setDuplicateModal({ folder_id: parentFolderId });
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
