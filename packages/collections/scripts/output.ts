import fs from "fs";
import { mkdirp } from "mkdirp";
import { RecipeProject, Recipe } from "types/database";
import { findFilesInDir } from "./utils";
import { PATHS } from "./constants";

export function buildOutput() {
  let collections: (RecipeProject & {
    rank?: number;
  })[] = [];
  findFilesInDir(
    "./core",
    "collection.json",
    (filePath) => {
      const content = fs.readFileSync(filePath, "utf8");

      const jsonContent = JSON.parse(content.trim());
      collections.push(jsonContent);
    },
    () => {
      const outputPathForCollections = "./build/core";

      // If rank field, sort higher rank first. Rank is higher than no rank
      collections.sort((a, b) => {
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        } else if (a.rank) {
          return -1;
        } else if (b.rank) {
          return 1;
        } else {
          return 0;
        }
      });

      mkdirp.sync(outputPathForCollections);

      fs.writeFileSync(
        `${outputPathForCollections}/collections.json`,
        JSON.stringify(collections),
        "utf8"
      );

      fs.writeFileSync(
        PATHS.WEB_PUBLIC_CORE + "/collections.json",
        JSON.stringify(collections),
        "utf8"
      );
    }
  );

  let apiRecipes: Recipe[] = [];
  findFilesInDir(
    "./core",
    "api.json",
    (filePath) => {
      const apiContent = fs.readFileSync(filePath, "utf8");
      const apiJsonContent = JSON.parse(apiContent.trim()) as Recipe;
      let recipes: null | any = null;

      try {
        let recipeContent = fs.readFileSync(
          filePath.replace("api.json", "recipes.json"),
          "utf8"
        );
        recipes = JSON.parse(recipeContent.trim());
      } catch (e) {
        // console.log("No recipes found for API:", filePath);
      }

      apiJsonContent.templates = recipes;

      apiRecipes.push(apiJsonContent);
    },
    () => {
      const outputPathForFolder = `./build/core`;

      // If their is a rank for the recipe, it will take place over those without a rank
      // The lower the rank, the higher it's priority
      // If no rank, then we sort by tag count
      apiRecipes.sort((a, b) => {
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        } else if (a.rank) {
          return -1;
        } else if (b.rank) {
          return 1;
        } else {
          const bTags = b.tags?.length ?? 0;
          const aTags = a.tags?.length ?? 0;

          if (bTags === aTags) {
            const bDate = b.created_at ? new Date(b.created_at) : new Date();
            const aDate = a.created_at ? new Date(a.created_at) : new Date();

            return bDate.getTime() - aDate.getTime();
          }
          return bTags - aTags;
        }
      });

      mkdirp.sync(outputPathForFolder);

      fs.writeFileSync(
        `${outputPathForFolder}/apis.json`,
        JSON.stringify(apiRecipes),
        "utf8"
      );

      fs.writeFileSync(
        PATHS.WEB_PUBLIC_CORE + "/apis.json",
        JSON.stringify(apiRecipes),
        "utf8"
      );
    }
  );
}
