"use client";

import { SupabaseClient } from "@supabase/supabase-js";
import { Database, UserTemplate } from "types/database";

export async function getTemplate(
  templateId: string,
  supabase: SupabaseClient<Database>
) {
  //   This should already have RLS
  const { data: templateData, error } = await supabase
    .from("template")
    .select("*")
    .eq("id", templateId)
    .single();

  return error || !templateData
    ? null
    : (templateData as unknown as UserTemplate);
}
