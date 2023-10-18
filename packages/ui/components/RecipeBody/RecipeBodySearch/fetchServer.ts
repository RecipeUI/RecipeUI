"use server";

import { RecipeMutationContentType } from "types/enums";
import { FetchRequest, FetchResponse } from "../../../state/recipeSession";
import { convertObjectToFormData } from "../../../utils/main";
import { parse } from "json5";
import { MergeDeep } from "type-fest";

export async function fetchServer({
  url,
  payload,
}: FetchRequest): Promise<FetchResponse> {
  const modifiedPayload: FetchRequest["payload"] = {
    ...payload,
    body: payload.body || undefined,
  };

  if (
    (payload.body_type === RecipeMutationContentType.FormData ||
      payload.headers["content-type"]?.includes("form")) &&
    payload.body &&
    typeof payload.body === "string"
  ) {
    delete modifiedPayload.headers["content-type"];
    modifiedPayload.body = convertObjectToFormData(parse(payload.body));
  }

  const { body_type, ...newPayload } = modifiedPayload;
  const res = await fetch(url, newPayload);

  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });

  console.debug({ url, payload: newPayload });
  console.debug("Request Content-Type", res.headers.get("content-type"));

  return {
    output: await res.text(),
    status: res.status,
    contentType: res.headers.get("content-type") || "text/plain",
    headers: headers,
  };
}
