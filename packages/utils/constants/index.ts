export const RECIPE_FORKING_ID = "recipeForkingId";
export const COLLECTION_FORKING_ID = "collectionForkingId";
export const DISCORD_LINK = "https://discord.gg/rXmpYmCNNA";
export const GITHUB_LINK = "https://github.com/RecipeUI/RecipeUI/issues";
export const GOOGLE_FORMS_LINK =
  "https://docs.google.com/forms/d/e/1FAIpQLSdLNghT9a28Qd0UEpb1gJN5EiCTaqHqQOiw4FO2rK2PMT5Kwg/viewform";
export const RECIPE_UI_BASE_URL = "https://recipeui.com";

export const ONBOARDING_CONSTANTS = {
  QUERY_ONBOARDING: "QUERY_ONBOARDING",
  URL_ONBOARDING: "URL_ONBOARDING",
} as const;

export type OnboardingKey = keyof typeof ONBOARDING_CONSTANTS;

export enum CollectionType {
  Core = "core",
  Community = "community",
}

export const URL_PARAM_REGEX = new RegExp(/{(\w+)}/, "g");
export const MARKDOWN_NEWLINES_REGEX = new RegExp(/(?<!\n)\n(?!\n)/, "g");
