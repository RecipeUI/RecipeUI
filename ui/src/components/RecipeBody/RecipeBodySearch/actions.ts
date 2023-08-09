"use server";

import { UserCreationError } from "@/components/Navbar/types";
import { RecipeParameters } from "@/state/recipeSession";
import { Database } from "@/types/database.types";
import { UserTemplate } from "@/types/databaseExtended";
import {
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createTemplate(
  payload: Omit<
    Database["public"]["Tables"]["template"]["Insert"],
    "requestBody" | "queryParams " | "urlParams"
  > &
    RecipeParameters
) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });

  //   This should already have RLS
  const {
    data: templateData,
    error,
    status,
  } = await supabase
    .from("template")
    // @ts-expect-error Should be right
    .insert({
      ...payload,
    })
    .select();

  return templateData ? templateData[0] : null;
}

export async function deleteTemplate(templateId: number) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });

  const { error } = await supabase
    .from("template")
    .delete()
    .eq("id", templateId);

  return error ? false : true;
}
