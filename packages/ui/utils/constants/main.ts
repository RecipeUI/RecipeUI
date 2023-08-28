export const RECIPE_PROXY = "https://recipe-proxy-node.fly.dev";

export const GITHUB_REPO = "https://github.com/RecipeUI/RecipeUI";

export const APP_COOKIE = "showApp";

export enum QueryKeys {
  Projects = "projects",
  Recipes = "recipes",
}

export const UNIQUE_ELEMENT_IDS = {
  SIGN_IN: "recipeSignIn",
  FORK_REGISTER_ID: "recipeForkId",
  RECIPE_SEARCH: "recipeSearch",
};

export const DB_FUNC_ERRORS = {
  TEMPLATE_LIMIT_REACHED: "TEMPLATE_LIMIT_REACHED",
};

export const FORM_LINKS = {
  RECIPEUI_PRO: "https://forms.gle/qVbwVWEtk6RPhuP46",
};

export const PLAYGROUND_SESSION_ID = "playgroundSessionId";

export const API_TYPE_NAMES = {
  APIRequestParams: "APIRequestParams",
  APIQueryParams: "APIQueryParams",
};

const API_SAMPLE_REQUEST_BODY_TYPE = `
// Define your request body with TypeScript.
// This will add auto-complete (CMD+SPACE) and validation!

export interface ${API_TYPE_NAMES.APIRequestParams} {
  // model: string;
  // messages: {
  //    role: "system" | "user";
  //    content: string;
  // }[];
  // max_tokens?: number;
  // stream?: boolean;
}
`.trim();

const API_SAMPLE_QUERY_PARAMS_TYPE = `
// Define your query params with TypeScript.
// This will add auto-complete (CMD+SPACE) and validation!


export interface ${API_TYPE_NAMES.APIQueryParams} {
  // sort?: "asc" | "desc";
  // page?: number;
}
`.trim();

export const API_SAMPLES = {
  API_SAMPLE_REQUEST_BODY_TYPE,
  API_SAMPLE_QUERY_PARAMS_TYPE,
};

const baseURL = "https://recipe-proxy-node.fly.dev";
// const baseURL = "http://localhost:3000";

export const API_LOCAL_PROCESSING_URLS = {
  JSON_TO_TS: `${baseURL}/json-to-ts`,
  TS_TO_JSON: `${baseURL}/ts-to-jsonschema`,
};
