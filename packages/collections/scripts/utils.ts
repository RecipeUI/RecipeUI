import fs from "fs";
import path from "path";
import { produce } from "immer";
import { Recipe } from "types/database";
import { restrictObjectsAndArrays } from "utils";

export function restrictRecipes(recipes: NonNullable<Recipe["templates"]>) {
  return produce(recipes, (draft) => {
    for (const recipe of draft) {
      if (recipe.replay) {
        recipe.replay = restrictObjectsAndArrays(recipe.replay, {
          ignoreInitialArrayLength: true,
        }) as typeof recipe.replay;
      }
    }
  });
}

export const toSnakeCase = (str: string): string => {
  return (
    str
      // Convert spaces, underscores, or dashes to a space
      .replace(/[\s_-]+/g, " ")
      // Trim whitespaces and convert to lowercase
      .trim()
      // Replace spaces between words with an underscore
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      // Convert all characters to lowercase
      .toLowerCase()
      // Replace spaces with underscores
      .replace(/\s+/g, "_")
  );
};

export function findFilesInDir(
  startPath: string,
  filter: string,
  callback: (filePath: string) => void,
  postCompletion?: () => void
) {
  if (!fs.existsSync(startPath)) {
    console.log("No directory found:", startPath);
    return;
  }

  const files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      findFilesInDir(filename, filter, callback); // Recursive call
    } else if (filename.indexOf(filter) >= 0) {
      callback(filename);
    }
  }

  postCompletion?.();
}
