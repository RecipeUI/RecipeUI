const {
  REF_KEY,
  logDebug,
  camelCaseToTitleCase,
  clonePropertyIfExists,
  getSchemaRefFromVal,
  getSchemaType,
  pathsToTitleCase,
} = require("./utils");

function getRefDependencies(obj) {
  let results = [];

  Object.entries(obj).forEach(([key, value]) => {
    if (key === REF_KEY) {
      results.push(getSchemaRefFromVal(value));
    } else if (value && typeof value === "object") {
      results = results.concat(getRefDependencies(value));
    }
  });

  return results;
}

function getComponentSchema(schema, processedSchemas) {
  if (schema.hasOwnProperty(REF_KEY)) {
    const schemaRef = getSchemaRefFromVal(schema[REF_KEY]);
    return processedSchemas[schemaRef];
  }

  const recipeSchema = {};
  const type = getSchemaType(schema);
  const requiredFields = schema.required ?? [];

  if (type === "object") {
    recipeSchema.objectSchema = [];
    const properties = Object.keys(schema.properties ?? {});

    for (const property of properties) {
      const newSchema = getComponentSchema(
        schema.properties[property],
        processedSchemas
      );

      if (requiredFields.includes(property)) {
        newSchema.required = true;
      }

      recipeSchema.objectSchema.push({
        name: property,
        ...newSchema,
      });
    }
  }

  if (type === "array") {
    recipeSchema.arraySchema = {};
    const itemsSchema = schema.items;

    if (itemsSchema.hasOwnProperty(REF_KEY)) {
      const schemaRef = getSchemaRefFromVal(itemsSchema[REF_KEY]);
      recipeSchema.arraySchema = processedSchemas[schemaRef];
    } else {
      recipeSchema.arraySchema = getComponentSchema(
        itemsSchema,
        processedSchemas
      );
    }
  }

  if (type === "anyOf" || type === "oneOf" || type === "allOf") {
    recipeSchema.variants = schema[type].map((variant) =>
      getComponentSchema(variant, processedSchemas)
    );
  }

  recipeSchema.type = type;

  clonePropertyIfExists(schema, recipeSchema, "description");

  const api_docs = "https://platform.openai.com";

  if (recipeSchema["description"]) {
    recipeSchema["description"] = recipeSchema["description"].replace(
      /\]\((\/[^\)]+)\)/g,
      `](${api_docs}$1)`
    );
  }

  clonePropertyIfExists(schema, recipeSchema, "nullable");
  clonePropertyIfExists(schema, recipeSchema, "enum");
  clonePropertyIfExists(schema, recipeSchema, "minimum");
  clonePropertyIfExists(schema, recipeSchema, "maximum");
  clonePropertyIfExists(schema, recipeSchema, "default");
  clonePropertyIfExists(schema, recipeSchema, "example");
  clonePropertyIfExists(schema, recipeSchema, "minItems");
  clonePropertyIfExists(schema, recipeSchema, "maxItems");
  clonePropertyIfExists(schema, recipeSchema, "additionalProperties");
  clonePropertyIfExists(schema, recipeSchema, "format");

  return recipeSchema;
}

const DEBUG_COMPONENT_SCHEMAS = true;
function getComponentSchemaDirectory(api) {
  const componentSchemas = {};
  let toProcessSchemas = Object.keys(api.components.schemas ?? {});

  let current_round = 1;
  while (toProcessSchemas.length > 0) {
    logDebug(`\nCurrent Round: ${current_round}\n`, DEBUG_COMPONENT_SCHEMAS);

    const needToProcessAgain = [];

    for (const schemaName of toProcessSchemas) {
      const schema = api.components.schemas[schemaName];

      logDebug(
        `\n ------ Processing ${schemaName} ------`,
        DEBUG_COMPONENT_SCHEMAS
      );
      logDebug(schema, DEBUG_COMPONENT_SCHEMAS);

      const dependencies = getRefDependencies(schema);

      let hasAllDependencies = true;
      for (const dependency of dependencies) {
        if (!componentSchemas[dependency]) {
          hasAllDependencies = false;
          break;
        }
      }

      if (!hasAllDependencies) {
        needToProcessAgain.push(schemaName);
      } else {
        componentSchemas[schemaName] = getComponentSchema(
          schema,
          componentSchemas
        );
      }
    }

    // If we were unable to process any schema, then we break the loop
    if (
      needToProcessAgain.length === toProcessSchemas.length &&
      needToProcessAgain.length > 0
    ) {
      console.error(
        "The dependency graphs for these schemas are bad: ",
        needToProcessAgain.join(",")
      );
      break;
    } else {
      toProcessSchemas = needToProcessAgain;
    }

    current_round += 1;
  }

  return componentSchemas;
}

// ---- Recipes - Main Functions ----

const DEBUG_RECIPES_SCHEMAS = false;
function getRecipes(api, componentSchemas, projectConfig) {
  const paths = api.paths;
  const recipes = [];

  for (const [path, pathSchema] of Object.entries(paths)) {
    for (const [method, methodSchema] of Object.entries(pathSchema)) {
      logDebug(`\n\n${method.toUpperCase()} ${path}`, DEBUG_RECIPES_SCHEMAS);
      logDebug(methodSchema, DEBUG_RECIPES_SCHEMAS);

      const recipe = {};
      recipe.summary = methodSchema.summary;
      recipe.method = method.toUpperCase();

      if (methodSchema.operationId) {
        recipe.title = camelCaseToTitleCase(methodSchema.operationId);
      } else {
        recipe.title = pathsToTitleCase(path);
      }

      logDebug("Title processed", recipe.title);

      recipe.path = `${projectConfig.server}${path}`;
      recipe.project = projectConfig.project;
      recipe.auth =
        projectConfig.auth && projectConfig.auth_apply === "all"
          ? projectConfig.auth
          : null;

      if (methodSchema.hasOwnProperty("requestBody")) {
        recipe.requestBody = {};

        const content = methodSchema.requestBody.content;
        const contentType = Object.keys(content)[0];

        if (REF_KEY in content[contentType].schema) {
          const componentReferenceKey = getSchemaRefFromVal(
            content[contentType].schema[REF_KEY]
          );

          recipe.requestBody = {
            ...componentSchemas[componentReferenceKey],
          };
        } else {
          recipe.requestBody = {
            ...getComponentSchema(
              content[contentType].schema,
              componentSchemas
            ),
          };
        }
        recipe.requestBody.contentType = contentType;

        clonePropertyIfExists(
          methodSchema.requestBody,
          recipe.requestBody,
          "required"
        );
      }

      recipes.push(recipe);
    }
  }

  return recipes;
}

export function processYamlSpec(api, project = "OpenAI", version = "1") {
  try {
    const { info, servers } = api;

    const componentSchemas = getComponentSchemaDirectory(api);
    const server = servers[0].url;

    const projectId = `${project}_v${version}`;
    const projectConfig = {
      id: projectId,
      project,
      version,
      server,
      auth: "bearer",
      auth_apply: "all",
      ...info,
    };

    const recipes = getRecipes(api, componentSchemas, projectConfig);
    return recipes;
  } catch (e) {
    console.error(e);
  }
}

module.exports = {
  processYamlSpec,
};
