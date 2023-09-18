import { Command } from "commander";
import fs from "fs";
import { Recipe, RecipeProject } from "types/database";
import Fuse from "fuse.js";
import path from "path";
import { mkdirp } from "mkdirp";
import { buildOutput } from "./output";
import prompts from "prompts";
import { CollectionType, RECIPE_UI_BASE_URL } from "utils/constants";
import { isUUID } from "utils";
import { PATHS } from "./constants";
import { minifyRecipeTemplates } from "./minify";

const program = new Command();

const getCollections = () => {
  const coreCollections = JSON.parse(
    fs.readFileSync(PATHS.CORE_COLLECTION, "utf8")
  ) as RecipeProject[];

  const communityCollections = JSON.parse(
    fs.readFileSync(PATHS.COMMUNITY_COLLECTION, "utf8")
  ) as RecipeProject[];

  return [...coreCollections, ...communityCollections];
};

const getAPIs = () => {
  const coreAPIs = JSON.parse(
    fs.readFileSync(PATHS.CORE_APIS, "utf8")
  ) as Recipe[];
  const communityAPIs = JSON.parse(
    fs.readFileSync(PATHS.COMMUNITY_APIS, "utf8")
  ) as Recipe[];

  return [...coreAPIs, ...communityAPIs];
};

program.version("1.0.0").description("An example CLI for managing a directory");

program
  .command("list")
  .description("List all collections")
  .action(() => {
    const collections = getCollections();
    const names = collections
      .map((collection) => collection.project)
      .join("\n");
    console.log(names);
  });

program
  .command("apis")
  .description("List all APIs")
  .action(() => {
    const apis = getAPIs();
    const names = apis
      .map((api) => `${api.title}\n${api.method} ${api.path}`)
      .join("\n\n");
    console.log(names);
  });

program
  .command("search <name>")
  .description("Search for a collection or API")
  .action((name) => {
    const apis = getAPIs().map(
      (api) => `[API] ${api.title}\n${api.method} ${api.path}\nid: ${api.id}`
    );
    const collections = getCollections().map(
      (collection) => `[Collection] ${collection.project}\nid: ${collection.id}`
    );

    const fuse = new Fuse([...apis, ...collections]);

    console.log(
      fuse
        .search(name)
        .map((result) => result.item)
        .join("\n\n") || "No results"
    );
  });

program
  .command("info <id>")
  .description("Get info about a collection or API")
  .action((id) => {
    const apis = getAPIs();
    const api = apis.find((api) => api.id === id);
    if (api) {
      // We should delete templates because it's long

      if (api.templates) {
        // @ts-ignore
        api.templates = api.templates.map((template) => template.title);
      }
      console.log(JSON.stringify(api, null, 2));
      return;
    }

    const collections = getCollections();
    const collection = collections.find((collection) => collection.id === id);
    if (collection) {
      console.log(JSON.stringify(collection, null, 2));
      return;
    }

    console.log("No results");
  });

program
  .command("build")
  .description("Build the collections and apis")
  .action(() => {
    buildOutput();
  });

program
  .command("contribute")
  .description("Contribute APIs from a collection to RecipeUI")
  .option("--core", "add to core lib")
  .action(async (options: { core?: boolean }) => {
    const collectionIdPrompt = await prompts({
      type: "text",
      name: "collectionId",
      message: "Enter the collection id or url from your collection.",
      validate: (value) => {
        let idValue = value;

        if (typeof value === "string") {
          if (value.startsWith("https://recipeui.com/")) {
            idValue = value.split("https://recipeui.com/").pop();
          }
        }

        if (!isUUID(idValue)) {
          return "Invalid collection id. Must be a uuid like b8b3109d-38b0-4ea6-81a7-059cf64e3550";
        }

        return true;
      },
    });
    const collection_id = collectionIdPrompt.collectionId.startsWith(
      "https://recipeui.com/"
    )
      ? collectionIdPrompt.collectionId.split("https://recipeui.com/").pop()
      : collectionIdPrompt.collectionId;

    let collectionInfo: {
      project: RecipeProject | null;
      recipes: Recipe[] | null;
    } | null = null;

    try {
      const res = await fetch(
        `${RECIPE_UI_BASE_URL}/${collection_id}/info.json`
      );
      collectionInfo = await res.json();
    } catch (error) {
      console.error(error);
      return;
    }
    if (!collectionInfo?.recipes || !collectionInfo?.project) {
      console.error("No collection or APIs found on RecipeUI.");
      return;
    }

    const selectedAPIs = await prompts({
      type: "multiselect",
      name: "apis",
      message: "Select APis you want to contribute",
      choices: collectionInfo.recipes.map((recipe) => ({
        title: recipe.title,
        description: recipe.summary.slice(0, 50),
        value: recipe,
      })),
    });

    if (selectedAPIs.apis.length === 0) {
      console.log("No APIs selected");
      return;
    }

    // Ask user about project name
    const projectNameRes = await prompts({
      type: "text",
      name: "projectName",
      initial: collectionInfo.project.title,
      message:
        "What would you like to name the project? (no spaces in name, prefer title case)",
      validate: (value) => {
        if (value.includes(" ")) {
          return "Project name cannot contain spaces.";
        }

        return true;
      },
    });

    let projectName = projectNameRes.projectName;
    collectionInfo.project.project = projectName;
    collectionInfo.project.visibility = "public";
    collectionInfo.project.scope = "global";

    // Check to see if collection folder already exists
    const folderPath = path.join(
      PATHS.COLLECTIONS_DIR,
      options.core ? CollectionType.Core : CollectionType.Community,
      projectName // Title here is a bit of a gotcha, be careful a bit
    );
    let collectionExists = fs.existsSync(`${folderPath}/collection.json`);

    if (!collectionExists) {
      try {
        mkdirp.sync(folderPath);

        fs.writeFileSync(
          `${folderPath}/collection.json`,
          JSON.stringify(collectionInfo.project, null, 2),
          "utf8"
        );
      } catch (error) {
        console.error(error);
        return;
      }
    }

    for (const api of selectedAPIs.apis as Recipe[]) {
      try {
        const APIPath = path.join(folderPath, api.title);

        minifyRecipeTemplates({
          collectionName: projectName,
          folderPath: APIPath,
          recipe: api,
        });

        // Need something here to create temapltes
      } catch (error) {
        console.log(`Error writing API ${api.title}`);
        console.error(error);
        return;
      }
    }

    buildOutput();

    console.log(
      "Done! Run RecipeUI locally to test and see your changes before submitting a PR."
    );
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
