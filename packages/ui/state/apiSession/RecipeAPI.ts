import { Recipe, TableInserts } from "types/database";
import { getConfigForSessionStore, getMiniRecipes } from ".";
import { ProjectScope, RecipeAuthType, Visibility } from "types/enums";
import { v4 as uuidv4 } from "uuid";

import { restrictObjectsAndArrays } from "utils";

export class CoreRecipeAPI {
  static getCoreRecipe = async ({
    recipeId,
    userId = "anonymous",
    existingRecipe,
  }: {
    recipeId: string;
    userId?: string;
    existingRecipe?: Recipe;
  }): Promise<TableInserts<"recipe">> => {
    const config = (await getConfigForSessionStore({ recipeId }))!;
    const miniRecipes = await getMiniRecipes(recipeId);

    let uploadRecipe: TableInserts<"recipe"> = {
      ...(existingRecipe
        ? existingRecipe
        : {
            project: "TBD",
            version: 1,
            rank: null,
            tags: [],

            id: recipeId,
            author_id: userId,
          }),

      method: config.editorMethod,
      path: config.editorUrl,

      queryParams: config.editorQuerySchemaJSON,
      queryParamsType: config.editorQuerySchemaType,

      requestBody: config.editorBodySchemaJSON,
      requestBodyType: config.editorBodySchemaType,

      urlParams: config.editorURLSchemaJSON,
      urlParamsType: config.editorURLSchemaType,

      title: config.editorHeader.title,
      summary: config.editorHeader.description,

      visibility: Visibility.Unlisted,

      templates: miniRecipes
        ? miniRecipes.map((r) => ({
            title: r.title,
            author_id: userId,
            description: r.description,
            project_scope: ProjectScope.Personal,
            urlParams: r.urlParams,
            queryParams: r.queryParams,
            requestBody: r.requestBody,
            replay: r.replay
              ? {
                  ...r.replay,
                  output: restrictObjectsAndArrays(r.replay.output),
                }
              : null,
          }))
        : [],

      authConfig: config.editorAuthConfig,
      auth: null,
      options: config.editorSessionOptions || null,
    };

    return uploadRecipe;
  };
}
