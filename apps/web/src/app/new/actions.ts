"use server";

import { AuthConfig, Recipe } from "types/database";
import { AuthFormType, RecipeAuthType } from "types/enums";

export async function uploadAPIs({
  apis,
  authType,
  authConfigs,
}: {
  apis: Omit<Recipe, "id">[];
  authType: AuthFormType;
  authConfigs: AuthConfig["payload"][];
}) {
  // Steps
  // 1. Get users current project. If it doesn't exist yet, then create one
  // 2. Create a new recipe for each API
  // 3. Redirect user back to home
}
