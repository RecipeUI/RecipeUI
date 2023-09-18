export const RECIPE_FORKING_ID = "recipeForkingId";
export const COLLECTION_FORKING_ID = "collectionForkingId";
export const DISCORD_LINK = "https://discord.gg/rXmpYmCNNA";
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
