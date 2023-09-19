import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import {
  Database,
  Recipe,
  RecipeProject,
  UserCloud,
  UserTemplatePreview,
} from "types/database";

export async function fetchUserCloud({
  user_id,
  supabase,
}: {
  user_id: string;
  supabase: SupabaseClient<Database>;
}) {
  const { data, error } = await supabase.from("user_cloud").select().single();
  // This is filtered by RLS

  let userCloud: UserCloud = {
    apis: [],
    collections: [],
    user_id: user_id,
  };

  if (error) {
    return userCloud;
  }

  if (data) {
    const dataCloud = data as unknown as Partial<UserCloud>;
    userCloud.apis = dataCloud.apis || [];
    userCloud.collections = dataCloud.collections || [];
  }

  return userCloud;
}
