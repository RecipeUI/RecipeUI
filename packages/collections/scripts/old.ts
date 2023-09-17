// findFilesInDir("./core", "recipes.json", (filePath: string) => {
//   const content = fs.readFileSync(filePath, "utf8");
//   let jsonContent;

//   try {
//     jsonContent = JSON.parse(content);
//   } catch (e) {
//     console.error(`Error parsing JSON from file: ${filePath}. Error: ${e}`);
//     return;
//   }

//   // Overwrite the file with updated content
//   fs.writeFileSync(
//     filePath,
//     JSON.stringify(restrictObjectsAndArrays(jsonContent), null, 2),
//     "utf8"
//   );
// });

// findFilesInDir("./core", "starter.json", (filePath: string) => {
//   const content = fs.readFileSync(filePath, "utf8");
//   let jsonContent: Recipe[];

//   try {
//     jsonContent = JSON.parse(content);
//   } catch (e) {
//     console.error(`Error parsing JSON from file: ${filePath}. Error: ${e}`);
//     return;
//   }

//   for (const recipe of jsonContent) {
//     const folderPath = filePath.replace("starter.json", recipe.title);

//     try {
//       mkdirp.sync(folderPath);
//     } catch (e) {}

//     if (recipe.templates) {
//       const templates = recipe.templates;

//       // @ts-expect-error override
//       delete recipe.templates;

//       fs.writeFileSync(
//         `${folderPath}/recipes.json`,
//         JSON.stringify(restrictRecipes(templates), null, 2),
//         "utf8"
//       );
//     }

//     // Overwrite the file with updated content
//     fs.writeFileSync(
//       `${folderPath}/api.json`,
//       JSON.stringify(recipe, null, 2),
//       "utf8"
//     );
//   }
//   fs.unlinkSync(filePath);
// });
