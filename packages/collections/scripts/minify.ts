import fs from "fs";
import { findFilesInDir, restrictRecipes } from "./utils";

findFilesInDir("./core", "recipes.json", (filePath: string) => {
  const content = fs.readFileSync(filePath, "utf8");
  let jsonContent;

  try {
    jsonContent = JSON.parse(content);
  } catch (e) {
    console.error(`Error parsing JSON from file: ${filePath}. Error: ${e}`);
    return;
  }

  // Overwrite the file with updated content
  fs.writeFileSync(
    filePath,
    JSON.stringify(restrictRecipes(jsonContent), null, 2),
    "utf8"
  );
});
