import { Recipe, TableInserts } from "types/database";
import { getConfigForSessionStore, getMiniRecipes } from ".";
import { ProjectScope, Visibility } from "types/enums";
import { v4 as uuidv4 } from "uuid";

export class CoreRecipeAPI {
  static getCoreRecipe = async ({
    recipeId,
    userId,
  }: {
    recipeId: string;
    userId: string;
  }): Promise<TableInserts<"recipe">> => {
    const config = (await getConfigForSessionStore({ recipeId }))!;
    const miniRecipes = await getMiniRecipes(recipeId);

    let uploadRecipe: TableInserts<"recipe"> = {
      id: recipeId,
      method: config.editorMethod,
      path: config.editorUrl,

      author_id: userId,

      queryParams: config.editorQuerySchemaJSON,
      queryParamsType: config.editorQuerySchemaType,

      requestBody: config.editorBodySchemaJSON,
      requestBodyType: config.editorBodySchemaType,

      urlParams: config.editorURLSchemaJSON,
      urlParamsType: config.editorURLSchemaType,

      project: "TBD",

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
            replay: r.replay,
          }))
        : [],

      auth: config.editorAuth?.type || null,
      options: {
        docs: config.editorAuth?.docs
          ? {
              auth: config.editorAuth.docs,
            }
          : undefined,
        auth: config.editorAuth
          ? [
              {
                type: config.editorAuth.type,
                payload: {
                  name: config.editorAuth.meta || config.editorAuth.type,
                },
              },
            ]
          : undefined,
      },

      version: 1,
      rank: null,
      tags: [],
    };

    return uploadRecipe;
  };
}
