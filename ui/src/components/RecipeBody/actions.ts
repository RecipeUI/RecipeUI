"use server";

import { UserCreationError } from "@/components/Navbar/types";
import { Database } from "@/types/database.types";
import { UserTemplate } from "@/types/databaseExtended";
import {
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
