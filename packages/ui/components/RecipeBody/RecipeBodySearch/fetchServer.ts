"use server";

import { Database, TableInserts } from "types/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { generateSlug } from "random-word-slugs";
import { DB_FUNC_ERRORS } from "../../../utils/constants/main";
import { RecipeMethod } from "types/enums";

// const payload: {
//     method: RecipeMethod;
//     headers: Record<string, string>;
//     body: string | FormData | undefined;
// }
interface FetchServerProps {
  url: string;
  payload: {
    method: RecipeMethod;
    headers: Record<string, string>;
    body: string | FormData | undefined;
  };
}

export async function fetchServer({ url, payload }: FetchServerProps) {
  console.log("made it in server,", payload, url);
  return fetch(url, payload);
}
