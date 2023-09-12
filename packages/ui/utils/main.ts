import { RecipeParam, RecipeProject } from "types/database";
import { ProjectScope, RecipeParamType } from "types/enums";
import { RecipeSession } from "../state/recipeSession";
import { JSONSchema6 } from "json-schema";

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

// export function getDefaultValue<T>(
//   param: RecipeParam,
//   checkRequired = false
// ): T | null | undefined {
//   if (checkRequired && !param.required) {
//     return undefined;
//   } else if (param["default"] !== undefined) {
//     return param.default as T;
//   } else if (param.type === RecipeParamType.String) {
//     if (param.enum && param.enum.length > 0) {
//       return param.enum[0] as T;
//     }

//     return "" as T;
//   } else if (param.type === RecipeParamType.Number) {
//     return (param["minimum"] || param["maximum"] || 0) as T;
//   } else if (param.type === RecipeParamType.Boolean) {
//     return false as T;
//   } else if (param.type === RecipeParamType.File) {
//     return null as T;
//   } else if (param.type === RecipeParamType.Array) {
//     return [getDefaultValue(param.arraySchema)] as T;
//   } else if (param.type === RecipeParamType.Object) {
//     const obj = {} as T;
//     for (const keySchema of param.objectSchema) {
//       const value = getDefaultValue(keySchema, true);
//       if (value !== undefined) {
//         // @ts-expect-error IDK what the type should be here
//         obj[keySchema.name] = value;
//       }
//     }
//     return obj as T;
//   } else if (
//     // TODO: AllOf is wrong here in some cases
//     "variants" in param
//   ) {
//     // Check to see if we can find an enum or default value in one of these
//     const hasEnumVariant = param.variants.find((variant) => "enum" in variant);
//     if (hasEnumVariant) {
//       return getDefaultValue(hasEnumVariant);
//     }

//     const hasVariantWithDefault = param.variants.find(
//       (variant) => variant.default != undefined
//     );
//     if (hasVariantWithDefault) {
//       return getDefaultValue(hasVariantWithDefault);
//     }

//     return getDefaultValue(param.variants[0]);
//   }

//   return null;
// }

export function getDefaultValuev1<T>(
  param: JSONSchema6,
  { checkRequired = false, isRequired = false }
): T | null | undefined {
  if (checkRequired && !isRequired) {
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
  } else if (param.type === RecipeParamType.Array) {
    return [
      getDefaultValuev1(param.items as unknown as JSONSchema6, {
        checkRequired: true,
        isRequired: true,
      }),
    ] as T;
    // return [getDefaultValue(param.arraySchema)] as T;
  } else if (param.type === RecipeParamType.Object) {
    const obj = {} as T;
    const properties = Object.keys(param.properties || {});

    for (const property of properties) {
      const value = getDefaultValuev1(
        param.properties![property] as JSONSchema6,
        {
          checkRequired: true,
          isRequired: true,
        }
      );
      if (value !== undefined) {
        // @ts-expect-error IDK what the type should be here
        obj[property] = value;
      }
    }
    return obj as T;
  }
  //  else if (
  //   // TODO: AllOf is wrong here in some cases
  //   "variants" in param
  // ) {
  //   // Check to see if we can find an enum or default value in one of these
  //   const hasEnumVariant = param.variants.find((variant) => "enum" in variant);
  //   if (hasEnumVariant) {
  //     return getDefaultValue(hasEnumVariant);
  //   }

  //   const hasVariantWithDefault = param.variants.find(
  //     (variant) => variant.default != undefined
  //   );
  //   if (hasVariantWithDefault) {
  //     return getDefaultValue(hasVariantWithDefault);
  //   }

  //   return getDefaultValue(param.variants[0]);
  // }

  return null;
}

export function getUrl() {
  let url =
    process?.env?.NEXT_PUBLIC_HOST ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:5173";

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getProjectSplit(projects: RecipeProject[]) {
  const globalProjects: RecipeProject[] = [];
  const userProjects: RecipeProject[] = [];

  for (const project of projects) {
    if (project.scope === ProjectScope.Global) {
      globalProjects.push(project);
    } else if (project.scope === ProjectScope.Personal) {
      userProjects.push(project);
    }
  }

  return {
    globalProjects,
    userProjects,
  };
}

export function getIsEmptySchema(schema: JSONSchema6) {
  return (
    schema.additionalProperties !== true &&
    (schema.properties == undefined ||
      Object.keys(schema.properties).length === 0)
  );
}

export function isSemverLessThan({
  oldVer,
  newVer,
}: {
  oldVer: string;
  newVer: string;
}): boolean {
  // Split the semver strings into their major, minor, and patch components
  const [major1, minor1, patch1 = 0] = oldVer.split(".").map(Number);
  const [major2, minor2, patch2 = 0] = newVer.split(".").map(Number);

  // Compare major versions
  if (major1 < major2) return true;
  if (major1 > major2) return false;

  // If major versions are equal, compare minor versions
  if (minor1 < minor2) return true;
  if (minor1 > minor2) return false;

  // If minor versions are equal, compare patch versions
  return patch1 < patch2;
}

export function isUUID(id: string) {
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;

  return regexExp.test(id);
}
