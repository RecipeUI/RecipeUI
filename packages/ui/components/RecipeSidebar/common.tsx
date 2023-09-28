import {
  RecipeSession,
  RecipeSessionFolder,
  RecipeSessionFolderExtended,
  RecipeSessionFolderItemExtended,
} from "types/database";
import { CSS } from "@dnd-kit/utilities";
import {
  DropAnimation,
  MeasuringStrategy,
  Modifier,
  UniqueIdentifier,
  defaultDropAnimation,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  MouseSensor as LibMouseSensor,
  KeyboardSensor as LibKeyboardSensor,
} from "@dnd-kit/core";
import { type MouseEvent, type KeyboardEvent, useMemo, useState } from "react";

export interface SessionFolderProps {
  folder: RecipeSessionFolderExtended;
  isRootFolder?: boolean;
  shouldClose?: boolean;
  hideOptions?: boolean;
}

export interface SessionTabProps {
  session: RecipeSession;
  hideOptions?: boolean;
}

export type SessionItem = SessionFolderProps | SessionTabProps;

export type FlattenedItem = RecipeSessionFolderItemExtended & {
  parentId: string | null;
  depth: number;
  index: number;
  clone?: boolean;
  childCount?: number;
  hideOptions?: boolean;
};

export function flatten(
  items: RecipeSessionFolderItemExtended[],
  depth = 0,
  parentId: string | null
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    return [
      ...acc,
      {
        ...item,
        index: index,
        depth: depth,
        parentId: parentId,
      },
      ...(item.type === "folder"
        ? flatten(item.folder.items, depth + 1, item.id)
        : []),
    ];
  }, []);
}

export function flattenRootFolders(
  items: RecipeSessionFolderExtended[]
): FlattenedItem[] {
  const folders = items.map((item) => {
    return {
      type: "folder",
      id: item.id,
      folder: item,
    } satisfies RecipeSessionFolderItemExtended;
  });

  return flatten(folders, 0, null);
}

export const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};
export const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ];
  },
  easing: "ease-out",
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

export const adjustTranslate: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 25,
  };
};

export function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);

  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);

  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];

  const dragDepth = Math.round(dragOffset / 20);
  const projectedDepth = activeItem.depth + dragDepth;

  let maxDepth = 0;
  if (previousItem) {
    maxDepth =
      previousItem.type === "folder"
        ? previousItem.depth + 1
        : previousItem.depth;
  }

  const minDepth = nextItem ? nextItem.depth : 0;
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

export class CustomMouseSensor extends LibMouseSensor {
  static activators = [
    {
      eventName: "onMouseDown" as const,
      handler: ({ nativeEvent: event }: MouseEvent) => {
        return shouldHandleEvent(event.target as HTMLElement);
      },
    },
  ];
}

function shouldHandleEvent(element: HTMLElement | null) {
  let cur = element;

  while (cur) {
    if (cur.dataset && cur.dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement;
  }

  return true;
}
