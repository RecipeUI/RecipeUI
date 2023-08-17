"use client";

import { Database, UserTemplate } from "types/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function getTemplate(templateId: number) {
  const supabase = createClientComponentClient<Database>();

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
