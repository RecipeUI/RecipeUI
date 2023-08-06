const { Command } = require("commander");
const program = new Command();
const fs = require("fs");
const yaml = require("js-yaml");

const { processYamlSpec } = require("./src/main");

program
  .name("openapi-parser")
  .description("Given an OpenAPI YAML file, generate a JSON file with recipes")
  .version("1.0.0");

program
  .command("parse-yaml")
  .description("Given a yaml file, generate a JSON file with recipes")
  .option(
    "-f, --file-path <path>",
    "Location of the yaml file. Place in same folder as index.js and name input.yaml by default",
    "./input.yaml"
  )
  .option(
    "-da, --debug-artifacts",
    "Prints out debug messages. This will also output the api.json and components.json files to the output folder",
    false
  )
  .requiredOption(
    "-p, --project <project>",
    "This will be the name of the file inside recipes. e.g recipes/{project}_{version}.json"
  )
  .requiredOption(
    "-v, --version <version>",
    "This will be the name of the version inside recipes. e.g recipes/{project}_{version}.json"
  )
  .action(({ filePath, project, version, debugArtifacts }, options) => {
    const file = fs.readFileSync(filePath, "utf8");
    const api = yaml.load(file);

    processYamlSpec(api, project, version, debugArtifacts);
  });

program.parse();
