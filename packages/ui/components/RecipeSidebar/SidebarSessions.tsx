import { useRecipeSessionStore } from "../../state/recipeSession";
import { FolderAPI, useSessionFolders } from "../../state/apiSession/FolderAPI";

import {
  RecipeCloudContext,
  useRecipeCloud,
} from "../../state/apiSession/CloudAPI";
import { SortableItem } from "./SessionItem";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  UniqueIdentifier,
  DragStartEvent,
  DragMoveEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import {
  CustomMouseSensor,
  FlattenedItem,
  adjustTranslate,
  dropAnimationConfig,
  flattenRootFolders,
  getProjection,
  measuring,
} from "./common";
import { createPortal } from "react-dom";
import { produce } from "immer";

export function SidebarSessions() {
  const { rootFolderSessionsExtended, noFolderSessions } = useSessionFolders();
  const recipeCloud = useRecipeCloud();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const sessions = useRecipeSessionStore((state) => state.sessions);
  const setSessions = useRecipeSessionStore((state) => state.setSessions);

  const sensors = useSensors(
    useSensor(CustomMouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const {
    allItems,
    flattenedItems,
    activeItem,
    flattenedIds,
    flattenedNoFolderSessions,
  } = useMemo(() => {
    let flattenedItems = flattenRootFolders(rootFolderSessionsExtended);

    const collapsedItems = flattenedItems.map((item) =>
      item.type === "folder" && item.folder.collapsed ? item.id : null
    );

    const excludedFolders = [activeId, ...collapsedItems].filter(
      Boolean
    ) as string[];

    if (excludedFolders.length > 0) {
      flattenedItems = flattenedItems.filter((item) => {
        if (item.parentId && excludedFolders.includes(item.parentId)) {
          if (item.type === "folder") {
            excludedFolders.push(item.id);
          }
          return false;
        }

        return true;
      });
    }

    const flattenedNoFolderSessions: FlattenedItem[] = noFolderSessions.map(
      (session, i) => ({
        id: session.id,
        type: "session",
        session,
        depth: 0,
        parentId: null,
        index: i,
      })
    );

    const flattenedIds = [...flattenedItems, ...flattenedNoFolderSessions].map(
      (item) => item.id
    );

    const allItems = [...flattenedItems, ...flattenedNoFolderSessions];
    const activeItem = activeId
      ? allItems.find(({ id }) => id === activeId)
      : null;

    return {
      allItems,
      flattenedItems,
      flattenedIds,
      activeItem,
      flattenedNoFolderSessions,
    };
  }, [activeId, noFolderSessions, rootFolderSessionsExtended]);

  const projected =
    activeId && overId
      ? getProjection(allItems, activeId, overId, offsetLeft)
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={flattenedIds}
        strategy={verticalListSortingStrategy}
      >
        <RecipeCloudContext.Provider value={recipeCloud}>
          <ul className="menu py-0">
            {flattenedItems.map((item) => {
              return (
                <SortableItem
                  key={item.id}
                  {...item}
                  hideOptions={!!activeItem}
                  depth={
                    activeItem && item.id === activeItem.id && projected
                      ? projected.depth
                      : item.depth
                  }
                />
              );
            })}

            {flattenedNoFolderSessions.map((item) => {
              return (
                <SortableItem
                  key={item.id}
                  {...item}
                  hideOptions={!!activeItem}
                  depth={
                    activeItem && item.id === activeItem.id && projected
                      ? projected.depth
                      : item.depth
                  }
                />
              );
            })}
          </ul>

          {createPortal(
            <DragOverlay
              dropAnimation={dropAnimationConfig}
              modifiers={[adjustTranslate]}
            >
              {activeId && activeItem ? (
                <SortableItem
                  {...activeItem}
                  clone
                  hideOptions
                  childCount={
                    activeItem.type === "folder" &&
                    activeItem.folder.items.length > 0
                      ? activeItem.folder.items.length + 1
                      : 0
                  }
                />
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </RecipeCloudContext.Provider>
      </SortableContext>
    </DndContext>
  );

  function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
    setActiveId(activeId);
    setOverId(activeId);

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
  }

  async function handleDragEnd({ over }: DragEndEvent) {
    resetState();

    if (!projected || !over || !activeItem) return;

    const overItem = allItems.find((item) => item.id === over.id)!;

    if (
      overItem.id === activeItem.id &&
      activeItem.parentId === projected.parentId
    ) {
      return;
    }

    // ------ Items are in the same depth and same folder ------
    if (
      overItem.parentId === activeItem.parentId &&
      overItem.depth === projected.depth
    ) {
      // Edge cases. Root level
      if (overItem.depth === 0) {
        if (overItem.type !== activeItem.type) {
          console.debug("Cannot swap sessions to appear above folders");
          return;
        } else if (overItem.type === "folder") {
          const oldFolders = await FolderAPI.getAllFolders();
          const newFolders = produce({ folders: oldFolders }, (draft) => {
            const activeFolderIndex = draft.folders.findIndex(
              (folder) => folder.id === activeItem.id
            );
            const overFolderIndex = draft.folders.findIndex(
              (folder) => folder.id === overItem.id
            );

            draft.folders = arrayMove(
              draft.folders,
              activeFolderIndex,
              overFolderIndex
            );
          }).folders;

          await FolderAPI.setFolders(newFolders);
        } else {
          setSessions(
            produce({ sessions }, (draft) => {
              const overItemIndex = draft.sessions.findIndex(
                (item) => item.id === overItem.id
              );

              const activeItemIndex = draft.sessions.findIndex(
                (item) => item.id === activeItem.id
              );

              draft.sessions = arrayMove(
                draft.sessions,
                activeItemIndex,
                overItemIndex
              );
            }).sessions
          );
        }
      } else {
        const oldFolder = (await FolderAPI.getFolder(overItem.parentId!))!;
        const newFolder = produce(oldFolder, (draft) => {
          const overItemIndex = draft.items.findIndex(
            (item) => item.id === overItem.id
          );
          const activeItemIndex = draft.items.findIndex(
            (item) => item.id === activeItem.id
          );

          draft.items = arrayMove(draft.items, activeItemIndex, overItemIndex);
        });

        await FolderAPI.setFolder(newFolder);
      }
      return;
    }

    // ------ Items are from different depths ------
    // Remove the item what ever folder it is in.
    if (activeItem.parentId) {
      await FolderAPI.deleteSessionFromFolder(activeItem.id, true);
    }

    const isActiveItemBeforeOver =
      allItems.findIndex((item) => item.id === activeItem.id) <
      allItems.findIndex((item) => item.id === overItem.id);

    if (projected.parentId) {
      await FolderAPI.addSessionToFolder(
        activeItem.id,
        projected.parentId,
        undefined,
        {
          putNearId: overItem.id,
          putAfter: isActiveItemBeforeOver,
          type: activeItem.type,
        }
      );
    }

    await FolderAPI.finalize();
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty("cursor", "");
  }
}
