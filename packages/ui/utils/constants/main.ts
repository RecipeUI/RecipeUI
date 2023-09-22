export const RECIPE_PROXY = "https://recipe-proxy-node.fly.dev";

export const GITHUB_REPO = "https://github.com/RecipeUI/RecipeUI";

export const APP_COOKIE = "showApp";

export enum QueryKeys {
  Projects = "projects",
  Recipes = "recipes",
  PersonalCollections = "personalCollections",
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

const baseURL = "https://recipe-translator.fly.dev";
// const baseURL = "http://localhost:3000";

export const API_LOCAL_PROCESSING_URLS = {
  JSON_TO_TS: `${baseURL}/json-to-ts`,
  TS_TO_JSON: `${baseURL}/ts-to-jsonschema`,
};

export const REDIRECT_PAGE = "redirectURL";

export const RECIPE_UI_BASE_URL = "https://recipeui.com";

export const APP_GITHUB_LATEST_RELEASE_URL =
  "https://github.com/RecipeUI/RecipeUI/releases/latest/download/latest.json";
