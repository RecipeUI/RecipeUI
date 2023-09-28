"use server";

import { FetchRequest, FetchResponse } from "../../../state/recipeSession";
import { convertObjectToFormData } from "../../../utils/main";

export async function fetchServer({
  url,
  payload,
}: FetchRequest): Promise<FetchResponse> {
  const modifiedPayload = { ...payload };
  if (payload.headers["content-type"].includes("form") && payload.body) {
    modifiedPayload.body = JSON.stringify(
      convertObjectToFormData(JSON.parse(payload.body))
    );
  }

  const res = await fetch(url, payload);

  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    output: await res.text(),
    status: res.status,
    contentType: res.headers.get("content-type") || "text/plain",
    headers: headers,
  };
}
