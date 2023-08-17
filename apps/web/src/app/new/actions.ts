"use server";

import {
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { AuthConfig, Database, Recipe } from "types/database";
import {
  AuthFormType,
  ProjectMemberRole,
  ProjectScope,
  RecipeAuthType,
  Visibility,
} from "types/enums";
import { generateSlug } from "random-word-slugs";
import { redirect } from "next/navigation";

export async function uploadAPIs({
  username,
  apis,
  authType,
  authConfigs,
  project: _project,
  authDocs,
}: {
  username: string;
  apis: Omit<Recipe, "id">[];
  authType: AuthFormType;
  authConfigs: AuthConfig["payload"][];
  project: string | null;
  authDocs?: string;
}) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    return {
      error: "User not found",
    };
  }

  const projectName = _project || generateSlug(4);

  if (!_project) {
    console.log("Creating new project");
    // RLS currently being enforced for scope and visibility
    const { data, error } = await supabase.from("project").insert({
      project: projectName,

      title: `${username}'s APIs`,
      description: "Personal collection",
      scope: ProjectScope.Personal,
      visibility: Visibility.Public,
      owner_id: user.data.user.id,
    });

    if (error) {
      throw error;
    }
  }

  let recipeAuth: null | RecipeAuthType = null;

  if (authType === AuthFormType.Bearer) {
    recipeAuth = RecipeAuthType.Bearer;
  } else if (authType === AuthFormType.QueryParam) {
    recipeAuth = RecipeAuthType.Query;
  } else if (authType === AuthFormType.MultipleParams) {
    recipeAuth = RecipeAuthType.Custom;
  }
  const options: Recipe["options"] =
    recipeAuth != null
      ? {
          auth: authConfigs.map((config) => ({
            type: recipeAuth!,
            payload: config,
          })),
          docs: authDocs ? { auth: authDocs } : undefined,
        }
      : null;

  const recipes = apis.map((api, index) => {
    const isStreaming = api.path.includes("chat/completions");

    return {
      ...api,
      project: projectName,
      auth: recipeAuth,
      options: isStreaming
        ? { ...options, streaming: true, cors: isStreaming ? false : true }
        : options,
      author_id: user.data.user?.id!,
    };
  });

  const { error: insertError } = await supabase.from("recipe").insert(recipes);

  if (insertError) {
    throw insertError;
  }

  return projectName;
}
