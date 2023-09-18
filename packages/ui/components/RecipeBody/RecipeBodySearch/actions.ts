// "use client";

// import { Database, TableInserts } from "types/database";
// import { generateSlug } from "random-word-slugs";
// import { DB_FUNC_ERRORS } from "../../../utils/constants/main";
// import { SupabaseClient } from "@supabase/supabase-js";

// export async function createTemplate(
//   payload: Omit<TableInserts<"template">, "alias">,
//   supabase: SupabaseClient<Database>
// ) {
//   //   This should already have RLS
//   const { data: templateData, error } = await supabase
//     .from("template")
//     .insert({
//       ...payload,
//       alias: generateSlug(4),
//     })
//     .select();

//   return {
//     newTemplate: templateData ? templateData[0] : null,
//     error: error?.message || null,
//   };
// }

// export async function deleteTemplate(
//   templateId: string,
//   supabase: SupabaseClient<Database>
// ) {
//   const { error, status, statusText } = await supabase
//     .from("template")
//     .delete()
//     .eq("id", templateId);

//   return error ? false : true;
// }

// export async function cloneTemplate(
//   templateId: string,
//   supabase: SupabaseClient<Database>
// ) {
//   const { data: oldTemplateData } = await supabase
//     .from("template")
//     .select()
//     .eq("id", templateId)
//     .single();

//   if (!oldTemplateData) {
//     return {
//       newTemplate: null,
//       error: "Template not found",
//     };
//   }

//   const { data: userData } = await supabase.auth.getUser();

//   const { id, alias, ...oldProps } = oldTemplateData;

//   const { data: templateData, error } = await supabase
//     .from("template")
//     .insert({
//       ...oldProps,
//       alias: generateSlug(4),
//       author_id: userData.user?.id!,
//     })
//     .select();

//   if (error && error.message === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED) {
//     return {
//       newTemplate: null,
//       error: error.message,
//     };
//   }

//   const newTemplate = templateData ? templateData[0] : null;

//   if (!newTemplate || !userData.user?.id) {
//     return {
//       newTemplate: null,
//       error: "Something went wrong",
//     };
//   }

//   const { error: forkError } = await supabase.from("template_fork").insert({
//     new_author_id: userData.user?.id!,
//     new_template: newTemplate.id,
//     original_template: templateId,
//     original_author_id: oldTemplateData.author_id,
//   });

//   return { newTemplate, error: null };
// }
