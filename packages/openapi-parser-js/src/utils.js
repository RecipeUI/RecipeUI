const REF_KEY = "$ref";
const OUTPUT_DIR = "./output";
const RECIPE_DIR = "../recipes";

function logDebug(message, shouldDebug = true) {
  if (shouldDebug) {
    console.log(message);
  }
}

function camelCaseToTitleCase(input) {
  // Add space before uppercase letters and trim the result
  console.log("caml", input);
  const result = input.replace(/([A-Z])/g, " $1").trim();

  // Convert to title case
  return result.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function pathsToTitleCase(pathString) {
  console.log("Attempting split", pathString);
  return pathString
    .split("/")
    .filter(Boolean)
    .map((path) => path[0].toUpperCase() + path.slice(1))
    .join("");
}

function clonePropertyIfExists(obj1, obj2, property) {
  if (obj1.hasOwnProperty(property)) {
    obj2[property] = obj1[property];
  }
}

// The last part contains the name of the schema e.g #/components/schemas/SCHEMA_NAME
function getSchemaRefFromVal(val) {
  return val.split("/").pop();
}

function getSchemaType(schema) {
  if (schema.hasOwnProperty("type")) {
    if (schema.hasOwnProperty("format")) {
      return "file";
    }

    return schema.type;
  }

  if (schema.hasOwnProperty("properties")) {
    return "object";
  }

  if (schema.hasOwnProperty("items")) {
    return "array";
  }

  if (schema.hasOwnProperty("anyOf")) {
    return "anyOf";
  }

  if (schema.hasOwnProperty("oneOf")) {
    return "oneOf";
  }

  if (schema.hasOwnProperty("allOf")) {
    return "allOf";
  }

  return "string";
}

module.exports = {
  logDebug,
  camelCaseToTitleCase,
  clonePropertyIfExists,
  getSchemaRefFromVal,
  getSchemaType,
  pathsToTitleCase,
  REF_KEY,
  OUTPUT_DIR,
  RECIPE_DIR,
};
