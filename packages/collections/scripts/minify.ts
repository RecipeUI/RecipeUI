import fs from "fs";
import { mkdirp } from "mkdirp";
import { Recipe } from "types/database";
import { restrictRecipes } from "./utils";

export function minifyRecipeTemplates({
  collectionName,
  recipe,
  folderPath,
}: {
  collectionName: string;
  recipe: Recipe;
  folderPath: string;
}) {
  mkdirp.sync(folderPath);

  recipe.project = collectionName || recipe.project;

  if (recipe.templates) {
    const templates = recipe.templates;

    // @ts-expect-error override
    delete recipe.templates;

    if (templates.length > 0) {
      fs.writeFileSync(
        `${folderPath}/recipes.json`,
        JSON.stringify(restrictRecipes(templates), null, 2),
        "utf8"
      );
    }
  }

  // Restructure the keys a bit
  const {
    title,
    project,
    summary,
    created_at,
    path,
    method,
    ...remainingData
  } = recipe;

  recipe.visibility = "public";
  // Overwrite the file with updated content
  fs.writeFileSync(
    `${folderPath}/api.json`,
    JSON.stringify(
      {
        title,
        project,
        summary,
        created_at,
        path,
        method,
        ...remainingData,
      },
      null,
      2
    ),
    "utf8"
  );
}
