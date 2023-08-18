"use server";

import { FetchRequest, FetchResponse } from "../../../state/recipeSession";

export async function fetchServer({
  url,
  payload,
}: FetchRequest): Promise<FetchResponse> {
  const res = await fetch(url, payload);

  return {
    output: await res.text(),
    status: res.status,
    contentType: res.headers.get("content-type") || "text/plain",
  };
}
