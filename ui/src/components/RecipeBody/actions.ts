"use server";

import { Database } from "@/types/database.types";
import { UserTemplate } from "@/types/databaseExtended";
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
