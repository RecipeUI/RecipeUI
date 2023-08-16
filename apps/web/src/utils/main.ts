import { RecipeSession } from "@/state/recipeSession";
import { RecipeParam, RecipeParamType } from "types";

export function isArrayPath(str: string): boolean {
  // Check to see if string in format of [number]
  const re = /^\[\d+\]$/;
  return re.test(str);
}
export function getArrayPathIndex(str: string): number {
  return parseInt(str.slice(1, -1), 10);
}

export function getValueInObjPath<T = unknown>(
  obj: Record<string, unknown>,
  path: string
): T | undefined {
  const keys = path.split(".").slice(1); // Removes the empty string before the first '.'
  let value: unknown | Record<string, unknown> = obj;

  for (const key of keys) {
    if (isArrayPath(key)) {
      value = (value as unknown[])[getArrayPathIndex(key)];
      continue;
    }

    if (!(value as Record<string, unknown>)[key] === undefined) {
      return undefined;
    }

    value = (value as Record<string, unknown>)[key];
  }

  return value as T;
}

export function getDefaultValue<T>(
  param: RecipeParam,
  checkRequired = false
): T | null | undefined {
  if (checkRequired && !param.required) {
    return undefined;
  } else if (param["default"] !== undefined) {
    return param.default as T;
  } else if (param.type === RecipeParamType.String) {
    if (param.enum && param.enum.length > 0) {
      return param.enum[0] as T;
    }

    return "" as T;
  } else if (param.type === RecipeParamType.Number) {
    return (param["minimum"] || param["maximum"] || 0) as T;
  } else if (param.type === RecipeParamType.Boolean) {
    return false as T;
  } else if (param.type === RecipeParamType.File) {
    return null as T;
  } else if (param.type === RecipeParamType.Array) {
    return [getDefaultValue(param.arraySchema)] as T;
  } else if (param.type === RecipeParamType.Object) {
    const obj = {} as T;
    for (const keySchema of param.objectSchema) {
      const value = getDefaultValue(keySchema, true);
      if (value !== undefined) {
        // @ts-expect-error IDK what the type should be here
        obj[keySchema.name] = value;
      }
    }
    return obj as T;
  } else if (
    // TODO: AllOf is wrong here in some cases
    "variants" in param
  ) {
    // Check to see if we can find an enum or default value in one of these
    const hasEnumVariant = param.variants.find((variant) => "enum" in variant);
    if (hasEnumVariant) {
      return getDefaultValue(hasEnumVariant);
    }

    const hasVariantWithDefault = param.variants.find(
      (variant) => variant.default != undefined
    );
    if (hasVariantWithDefault) {
      return getDefaultValue(hasVariantWithDefault);
    }

    return getDefaultValue(param.variants[0]);
  }

  return null;
}

export function getURLParamsForSession(
  session: RecipeSession,
  moreParams?: Record<string, string>
) {
  return new URLSearchParams({
    sessionId: session.id,
    recipeId: String(session.recipeId),
    ...moreParams,
  }).toString();
}

export function getUrl() {
  let url =
    process?.env?.NEXT_PUBLIC_HOST ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:5173/";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { useScreen } from "usehooks-ts";

export function useIsMobile() {
  const screen = useScreen();
  return screen && screen.width < 640;
}