"use server";

import { UserCreationError } from "@/components/Navbar/types";
import { RecipeParameters } from "@/state/recipeSession";
import { Database } from "@/types/database.types";
import { UserTemplate } from "@/types/databaseExtended";
import { DB_FUNC_ERRORS } from "@/utils/constants";
import {
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateSlug } from "random-word-slugs";

export async function createTemplate(
  payload: Omit<
    Database["public"]["Tables"]["template"]["Insert"],
    "requestBody" | "queryParams " | "urlParams"
  > &
    RecipeParameters
) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });

  //   This should already have RLS
  const { data: templateData, error } = await supabase
    .from("template")
    // @ts-expect-error Should be right
    .insert({
      ...payload,
      alias: generateSlug(4),
    })
    .select();

  return {
    newTemplate: templateData ? templateData[0] : null,
    error: error?.message || null,
  };
}

export async function deleteTemplate(templateId: number) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });

  const { error } = await supabase
    .from("template")
    .delete()
    .eq("id", templateId);

  return error ? false : true;
}

export async function cloneTemplate(templateId: number) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });

  const { data: oldTemplateData } = await supabase
    .from("template")
    .select()
    .eq("id", templateId)
    .single();

  if (!oldTemplateData) {
    return {
      newTemplate: null,
      error: "Template not found",
    };
  }

  const { data: userData } = await supabase.auth.getUser();

  const { id, alias, ...oldProps } = oldTemplateData;

  const { data: templateData, error } = await supabase
    .from("template")
    .insert({
      ...oldProps,
      alias: generateSlug(4),
      author_id: userData.user?.id!,
    })
    .select();

  if (error && error.message === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED) {
    return {
      newTemplate: null,
      error: error.message,
    };
  }

  const newTemplate = templateData ? templateData[0] : null;

  if (!newTemplate || !userData.user?.id) {
    return {
      newTemplate: null,
      error: "Something went wrong",
    };
  }

  await supabase.from("template_fork").insert({
    new_author_id: userData.user?.id!,
    new_template: newTemplate.id,
    original_template: templateId,
    orginal_auth: oldTemplateData.author_id,
    original_author_id: oldTemplateData.author_id,
  });

  return { newTemplate, error: null };
}
