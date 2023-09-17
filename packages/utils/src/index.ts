import { produce } from "immer";

export function restrictObjectsAndArrays<T>(
  obj: Record<string, unknown> | Array<Record<string, unknown>>,
  options?: {
    ignoreInitialArrayLength?: boolean;
  }
): T {
  const ARRAY_REDUCE_FACTOR = 3;
  const OBJECT_REDUCE_FACTOR = 10;

  function recursivelyReduce(_obj: Record<string, unknown>) {
    let count = 0;
    let additionalProperties: string[] = [];

    const entries = Object.entries(_obj);
    for (const [key, value] of entries) {
      count += 1;

      if (count >= OBJECT_REDUCE_FACTOR) {
        additionalProperties.push(key);
        delete _obj[key];
        continue;
      }

      if (Array.isArray(value)) {
        const restrictedArray = value.slice(0, ARRAY_REDUCE_FACTOR);
        _obj[key] = restrictedArray;

        for (const item of restrictedArray) {
          if (typeof item === "object" && item !== null) {
            recursivelyReduce(item as Record<string, unknown>);
          }
        }

        if (value.length >= 3) {
          restrictedArray.push("...");
        }
      } else if (typeof value === "object" && value !== null) {
        recursivelyReduce(value as Record<string, unknown>);
      }
    }

    if (additionalProperties.length > 0) {
      _obj["_recipeui_additionalProperties"] = additionalProperties;
    }
  }

  return produce(obj, (draft) => {
    if (Array.isArray(draft)) {
      if (
        options?.ignoreInitialArrayLength !== true &&
        draft.length > ARRAY_REDUCE_FACTOR &&
        (draft[draft.length - 1] as unknown) !== "..."
      ) {
        draft.splice(ARRAY_REDUCE_FACTOR);
        draft.push("..." as unknown as any);
      }

      for (const item of draft) {
        if (typeof item === "object" && item !== null) {
          recursivelyReduce(item as Record<string, unknown>);
        }
      }
    } else {
      recursivelyReduce(draft);
    }
  }) as T;
}
