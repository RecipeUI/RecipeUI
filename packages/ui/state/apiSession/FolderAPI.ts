"use client";
import { RecipeSessionFolder } from "../recipeSession";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getFolderStore, eventEmitter } from ".";

export class FolderAPI {
  static addSessionToFolder = async (
    sessionId: string,
    folderId: string,
    newFolderName?: string
  ) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");

    let foundFolder = false;
    const newFolders = (folders || []).map((folder) => {
      if (folder.id !== folderId) return folder;

      foundFolder = true;
      return {
        ...folder,
        sessionIds: [...folder.sessionIds, sessionId],
      };
    });

    if (!foundFolder) {
      newFolders.push({
        id: folderId,
        name: newFolderName ?? "New Folder",
        sessionIds: [sessionId],
      });
    }

    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static deleteSessionFromFolder = async (sessionId: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");

    const foldersToDelete: string[] = [];
    let newFolders = (folders || []).map((folder) => {
      let madeChange = false;
      const returnFolder = {
        ...folder,
        sessionIds: folder.sessionIds.filter((id) => {
          if (id !== sessionId) {
            return true;
          }

          madeChange = true;
          return false;
        }),
      };

      if (madeChange && returnFolder.sessionIds.length === 0) {
        foldersToDelete.push(returnFolder.id);
      }

      return returnFolder;
    });

    newFolders = newFolders.filter(
      (folder) => !foldersToDelete.includes(folder.id)
    );

    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static removeFolder = async (folderId: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
    const newFolders = (folders || []).filter(
      (folder) => folder.id !== folderId
    );
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static editFolderName = async (folderId: string, name: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
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

  static addFolder = async (folderName: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
    const newFolders = [
      ...(folders || []),
      {
        id: uuidv4(),
        name: folderName,
        sessionIds: [],
      } as RecipeSessionFolder,
    ];
    await store.put(newFolders, "sessionFolders");
    eventEmitter.emit("refreshFolders");
  };

  static getFolder = async (folderId: string) => {
    const store = await getFolderStore();
    const folders = await store.get("sessionFolders");
    return (folders || []).find((folder) => folder.id === folderId);
  };
}

export const addFolder = async (folderName: string) => {
  const store = await getFolderStore();
  const folders = await store.get("sessionFolders");
  const newFolders = [
    ...(folders || []),
    {
      id: uuidv4(),
      name: folderName,
      sessionIds: [],
    } as RecipeSessionFolder,
  ];
  await store.put(newFolders, "sessionFolders");
  eventEmitter.emit("refreshFolders");
};

export function useSessionFolders() {
  const [folders, setFolders] = useState<RecipeSessionFolder[]>([]);

  useEffect(() => {
    async function refreshFolders() {
      const store = await getFolderStore();
      const folders = await store.get("sessionFolders");
      setFolders(folders || []);
    }

    refreshFolders();

    eventEmitter.on("refreshFolders", refreshFolders);
    return () => {
      eventEmitter.off("refreshFolders", refreshFolders);
    };
  }, []);

  return folders;
}
