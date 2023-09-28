"use client";
import { RecipeSession, useRecipeSessionStore } from "../recipeSession";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getFolderStore, eventEmitter } from ".";
import {
  RecipeSessionFolder,
  RecipeSessionFolderExtended,
} from "types/database";

export class FolderAPI {
  static addSessionToFolder = async (
    itemId: string,
    folderId: string,
    newFolderName?: string,
    options?: {
      putNearId?: string;
      putAfter?: boolean;
      type: "session" | "folder";
    }
  ) => {
    const type = options?.type ?? "session";
    const folders = await this.getAllFolders();
    const store = await getFolderStore();

    let foundFolder = false;

    const newFolders = folders.map((folder) => {
      if (folder.id !== folderId) return folder;

      foundFolder = true;

      let items = [...folder.items];

      const { putNearId, putAfter } = options || {};
      const putNearIndex = items.findIndex((item) => item.id === putNearId);
      if (putNearIndex !== -1) {
        items.splice(putAfter ? putNearIndex + 1 : putNearIndex, 0, {
          type,
          id: itemId,
        });
      } else {
        items.push({
          type,
          id: itemId,
        });
      }

      return {
        ...folder,
        items,
      } satisfies typeof folder;
    });

    if (!foundFolder) {
      newFolders.push({
        id: folderId,
        name: newFolderName ?? "New Folder",
        items: [
          {
            id: itemId,
            type,
          },
        ],
      });
    }

    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static deleteSessionFromFolder = async (
    sessionId: string,
    ignoreEmit?: boolean
  ) => {
    const folders = await this.getAllFolders();
    const store = await getFolderStore();
    const foldersToDelete: string[] = [];

    let newFolders = folders.map((folder) => {
      let madeChange = false;

      const returnFolder = {
        ...folder,
        items: folder.items.filter(({ id }) => {
          if (id !== sessionId) {
            return true;
          }

          madeChange = true;
          return false;
        }),
      };

      if (madeChange && returnFolder.items.length === 0) {
        foldersToDelete.push(returnFolder.id);
      }

      return returnFolder;
    });

    newFolders = newFolders.filter(
      (folder) => !foldersToDelete.includes(folder.id)
    );

    await store.put(newFolders, "sessionFolders");

    if (!ignoreEmit) {
      eventEmitter.emit("refreshFolders");
    }
  };

  static removeFolder = async (folderId: string) => {
    const folders = await this.getAllFolders();
    const store = await getFolderStore();

    const affectedSessionIds = new Set<string>();
    const affectedFolderIds = new Set([folderId]);
    const folderQueue = [folderId];

    while (folderQueue.length > 0) {
      const folderId = folderQueue.pop()!;
      const folder = folders.find((folder) => folder.id === folderId);
      if (!folder) {
        continue;
      }

      for (const item of folder.items) {
        if (item.type === "session") {
          affectedSessionIds.add(item.id);
        } else {
          affectedFolderIds.add(item.id);
          folderQueue.push(item.id);
        }
      }
    }

    const newFolders = folders.filter(
      (folder) => !affectedFolderIds.has(folder.id)
    );

    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");

    return {
      affectedSessionIds: Array.from(affectedSessionIds),
      affectedFolderIds: Array.from(affectedFolderIds),
    };
  };

  static editFolderName = async (folderId: string, name: string) => {
    const folders = await this.getAllFolders();

    const store = await getFolderStore();
    const newFolders = (folders || []).map((folder) => {
      if (folder.id !== folderId) return folder;
      return {
        ...folder,
        name,
      };
    });
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static addFolder = async (folderName: string, existingFolderId?: string) => {
    let folders = await this.getAllFolders();

    const store = await getFolderStore();

    const newFolder = {
      id: uuidv4(),
      name: folderName,
      items: [],
      type: "folder",
    } as RecipeSessionFolder;

    if (existingFolderId) {
      folders = folders.map((folder) => {
        if (folder.id !== existingFolderId) return folder;

        return {
          ...folder,
          items: [...folder.items, { type: "folder", id: newFolder.id }],
        };
      });
    }

    const newFolders = [...folders, newFolder];
    await store.put(newFolders, "sessionFolders");

    eventEmitter.emit("refreshFolders");
  };

  static getFolder = async (folderId: string) => {
    const folders = await this.getAllFolders();
    return (folders || []).find((folder) => folder.id === folderId);
  };

  static setFolder = async (folder: RecipeSessionFolder) => {
    const folders = await this.getAllFolders();
    const store = await getFolderStore();
    const newFolders = folders.map((f) => {
      if (f.id !== folder.id) return f;
      return folder;
    });
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static getAllFolders = async () => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");

    // TODO: Cleanup after a month or so. We just need to deal with deprecated folders
    let hasChanged = false;
    let migratedFolders = folders?.map((folder) => {
      if (folder.sessionIds) {
        hasChanged = true;
        const sessionIds = folder.sessionIds;
        delete folder.sessionIds;

        folder.items = sessionIds.map((item) => ({
          type: "session",
          id: item,
        }));
      }

      return folder;
    });

    if (hasChanged && migratedFolders) {
      await store.put(migratedFolders, "sessionFolders");
    }

    return migratedFolders || [];
  };

  static setFolders = async (folders: RecipeSessionFolder[]) => {
    const store = await getFolderStore();
    await store.put(folders, "sessionFolders");

    eventEmitter.emit("refreshFolders");
  };

  static duplicateSession = async ({
    oldSessionId,
    oldFolderId,
    newSessionId,
  }: {
    oldSessionId: string;
    oldFolderId: string;
    newSessionId: string;
  }) => {
    const allFolders = await this.getAllFolders();
    const store = await getFolderStore();

    const newFolders = allFolders.map((folder) => {
      if (folder.id !== oldFolderId) return folder;

      return {
        ...folder,
        items: folder.items.map((item) => {
          if (item.type === "session" && item.id === oldSessionId) {
            return {
              type: "session",
              id: newSessionId,
            };
          }

          return item;
        }),
      } satisfies RecipeSessionFolder;
    });

    await store.put(newFolders, "sessionFolders");
  };

  static finalize = async () => {
    eventEmitter.emit("refreshFolders");
  };

  static getParentFolder = async (fileOrItem: string) => {
    const folders = await this.getAllFolders();

    for (const folder of folders) {
      if (folder.id === fileOrItem) {
        return folder;
      }
    }

    return folders.find((folder) => {
      return folder.items.some((item) => item.id === fileOrItem);
    });
  };

  static toggleFolderCollapse = async (folderId: string) => {
    const folders = await this.getAllFolders();
    const store = await getFolderStore();

    const newFolders = folders.map((folder) => {
      if (folder.id !== folderId) return folder;

      return {
        ...folder,
        collapsed: !(folder.collapsed ?? false),
      } satisfies RecipeSessionFolder;
    });

    await store.put(newFolders, "sessionFolders");

    await this.finalize();
  };
}

export const addFolder = async (folderName: string) => {
  const folders = await FolderAPI.getAllFolders();

  const store = await getFolderStore();
  const newFolders = [
    ...(folders || []),
    {
      id: uuidv4(),
      name: folderName,
      items: [],
    } as RecipeSessionFolder,
  ];
  await store.put(newFolders, "sessionFolders");
  eventEmitter.emit("refreshFolders");
};

interface FolderToSessions {
  [folderId: string]: RecipeSessionFolderExtended;
}

export function useSessionFolders() {
  const [folders, setFolders] = useState<RecipeSessionFolder[]>([]);
  const sessions = useRecipeSessionStore((state) => state.sessions);

  const {
    folderSessionsExtended,
    noFolderSessions,
    rootFolderSessionsExtended,
  } = useMemo(() => {
    const sessionRecord: Record<string, RecipeSession> = {};
    for (const session of sessions) {
      sessionRecord[session.id] = session;
    }

    const folderSessions: FolderToSessions = {};
    const subFolders = new Set<string>();

    function recursivelyProcessFolders(
      folder: RecipeSessionFolder
    ): RecipeSessionFolderExtended {
      const extendedFolder: RecipeSessionFolderExtended = {
        ...folder,
        items:
          folder.items
            .filter((item) => {
              // TODO: This is to deal with backwards compat
              if (item.type === "session") {
                return sessionRecord[item.id] != undefined;
              } else {
                return true;
              }
            })
            .map((item) => {
              if (item.type === "session") {
                const session = sessionRecord[item.id];
                delete sessionRecord[item.id];

                return {
                  type: "session",
                  id: item.id,
                  session,
                };
              } else {
                subFolders.add(item.id);
                const folder = folders.find((f) => f.id === item.id);
                if (!folder) {
                  return undefined as any;
                }

                return {
                  type: "folder",
                  id: item.id,
                  folder: recursivelyProcessFolders(folder),
                };
              }
            })
            .filter(Boolean) || [],
      };

      // TODO: This is deprecated. We can delete this in a few weeks.
      if (folder.sessionIds) {
        for (const sessionId of folder.sessionIds) {
          const session = sessionRecord[sessionId];
          if (!session) {
            continue;
          }

          delete sessionRecord[sessionId];

          extendedFolder.items.push({
            type: "session",
            id: sessionId,
            session,
          });
        }
      }

      return extendedFolder;
    }

    for (const folder of folders) {
      folderSessions[folder.id] = recursivelyProcessFolders(folder);
    }

    const noFolderSessions: RecipeSession[] = Object.values(sessionRecord);
    const folderSessionsExtended = Object.values(folderSessions);
    const rootFolderSessionsExtended = folderSessionsExtended.filter(
      (folder) => !subFolders.has(folder.id)
    );

    return {
      folderSessionsExtended,
      rootFolderSessionsExtended,
      noFolderSessions,
    };
  }, [folders, sessions]);

  useEffect(() => {
    async function refreshFolders() {
      const folders = await FolderAPI.getAllFolders();

      setFolders(folders || []);
    }

    refreshFolders();

    eventEmitter.on("refreshFolders", refreshFolders);
    return () => {
      eventEmitter.off("refreshFolders", refreshFolders);
    };
  }, []);

  return {
    folders,
    folderSessionsExtended,
    noFolderSessions,
    rootFolderSessionsExtended,
  };
}
