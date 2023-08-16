"use server";

import { Database, UserTemplate } from "types/database";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getTemplate(templateId: number) {
  const supabase = createServerActionClient<Database>({ cookies: cookies });

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
