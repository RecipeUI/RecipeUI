import fs from "fs";
import { mkdirp } from "mkdirp";
import { RecipeProject, Recipe } from "types/database";
import { findFilesInDir } from "./utils";
import { PATHS } from "./constants";
import { CollectionType } from "utils/constants";

type ExtendedCollection = RecipeProject & {
  rank?: number;
};

function parseCollection(filePath: string, collections: ExtendedCollection[]) {
  const content = fs.readFileSync(filePath, "utf8");

  const jsonContent = JSON.parse(content.trim());
  collections.push(jsonContent);
}

function publishCollection(
  type: CollectionType,
  collections: ExtendedCollection[]
) {
  const outputPathForCollections = `./build/${type}`;

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

  const WEB_FOLDER =
    type === CollectionType.Core
      ? PATHS.WEB_PUBLIC_CORE
      : PATHS.WEB_PUBLIC_COMMUNITY;

  mkdirp.sync(WEB_FOLDER);

  fs.writeFileSync(
    WEB_FOLDER + "/collections.json",
    JSON.stringify(collections),
    "utf8"
  );
}

function buildCollections() {
  let coreCollections: ExtendedCollection[] = [];
  findFilesInDir(
    "./core",
    "collection.json",
    (filePath) => {
      parseCollection(filePath, coreCollections);
    },
    () => {
      publishCollection(CollectionType.Core, coreCollections);
    }
  );

  const communityCollections: ExtendedCollection[] = [];
  findFilesInDir(
    "./community",
    "collection.json",
    (filePath) => {
      parseCollection(filePath, communityCollections);
    },
    () => {
      publishCollection(CollectionType.Community, communityCollections);
    }
  );
}

function parseAPIs(filePath: string, apis: Recipe[]) {
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

  apis.push(apiJsonContent);
}

function publishAPIs(type: CollectionType, apis: Recipe[]) {
  const outputPathForFolder = `./build/${type}`;

  // If their is a rank for the recipe, it will take place over those without a rank
  // The lower the rank, the higher it's priority
  // If no rank, then we sort by tag count
  apis.sort((a, b) => {
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
    JSON.stringify(apis),
    "utf8"
  );

  const WEB_FOLDER =
    type === CollectionType.Core
      ? PATHS.WEB_PUBLIC_CORE
      : PATHS.WEB_PUBLIC_COMMUNITY;

  mkdirp.sync(WEB_FOLDER);
  fs.writeFileSync(WEB_FOLDER + "/apis.json", JSON.stringify(apis), "utf8");
}

function buildAPIs() {
  let apiRecipes: Recipe[] = [];
  findFilesInDir(
    "./core",
    "api.json",
    (filePath) => {
      parseAPIs(filePath, apiRecipes);
    },
    () => {
      publishAPIs(CollectionType.Core, apiRecipes);
    }
  );

  const communityRecipes: Recipe[] = [];

  findFilesInDir(
    "./community",
    "api.json",
    (filePath) => {
      parseAPIs(filePath, communityRecipes);
    },
    () => {
      publishAPIs(CollectionType.Community, communityRecipes);
    }
  );
}

export function buildOutput() {
  buildCollections();
  buildAPIs();
}
