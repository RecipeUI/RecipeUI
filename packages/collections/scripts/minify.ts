import fs from "fs";
import { mkdirp } from "mkdirp";
import { RecipeProject, Recipe } from "types/database";
import { findFilesInDir, restrictRecipes } from "./utils";

findFilesInDir("./core", "import.json", (filePath: string) => {
  const recipe: Recipe | Recipe[] = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  let recipes = Array.isArray(recipe) ? recipe : [recipe];

  let collectionInfo: RecipeProject | null = null;
  try {
    collectionInfo = JSON.parse(
      fs.readFileSync(
        filePath.replace("import.json", "collection.json"),
        "utf8"
      )
    );
  } catch (e) {
    console.error(`Error parsing JSON from file: ${filePath}. Error: ${e}`);
    return;
  }

  if (!collectionInfo) {
    throw new Error("No collection info found");
  }

  const projectName = collectionInfo.project;

  return recipes.map((recipe) => {
    const folderPath = filePath.replace("import.json", recipe.title);

    try {
      mkdirp.sync(folderPath);
    } catch (e) {}

    recipe.project = projectName || recipe.project;

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
  });
});
