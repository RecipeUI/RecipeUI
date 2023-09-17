import { Command } from "commander";
import fs from "fs";
import { Recipe, RecipeProject } from "types/database";
import Fuse from "fuse.js";
import path from "path";
import { mkdirp } from "mkdirp";
import { buildOutput } from "./output";

const program = new Command();

const ROOT_DIR = path.join(process.cwd(), "../..");

export const PATHS = {
  CORE_COLLECTION: process.cwd() + "/build/core/collections.json",
  CORE_APIS: process.cwd() + "/build/core/apis.json",
  ROOT_DIR: ROOT_DIR,
  WEB: ROOT_DIR + "/apps/web",
  WEB_PUBLIC_CORE: ROOT_DIR + "/apps/web/public/core",
};

const getCollections = () => {
  return JSON.parse(
    fs.readFileSync(PATHS.CORE_COLLECTION, "utf8")
  ) as RecipeProject[];
};

const getAPIs = () => {
  return JSON.parse(fs.readFileSync(PATHS.CORE_APIS, "utf8")) as Recipe[];
};

program.version("1.0.0").description("An example CLI for managing a directory");

program
  .command("collections")
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

    const apis = getAPIs();
    const collections = getCollections();

    mkdirp.sync(PATHS.WEB_PUBLIC_CORE);

    fs.writeFileSync(
      PATHS.WEB_PUBLIC_CORE + "/collections.json",
      JSON.stringify(collections),
      "utf8"
    );

    fs.writeFileSync(
      PATHS.WEB_PUBLIC_CORE + "/apis.json",
      JSON.stringify(apis),
      "utf8"
    );

    // We also need to build this inside the web package
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
