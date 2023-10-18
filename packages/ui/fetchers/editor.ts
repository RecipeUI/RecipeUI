import { JSONSchema6 } from "json-schema";
import { API_LOCAL_PROCESSING_URLS } from "../utils/constants/main";

interface FetchTypeScriptFromJSON {
  types: string;
}

export async function fetchJSONFromTypeScript({
  types,
}: FetchTypeScriptFromJSON) {
  const res = await fetch(API_LOCAL_PROCESSING_URLS.TS_TO_JSON, {
    body: JSON.stringify({ types }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch JSON from TypeScript");
  }

  return res.json() as Promise<JSONSchema6>;
}

export async function fetchTypeScriptFromJSON({
  record,
  typeName,
}: {
  record: Record<string, any>;
  typeName: string;
}) {
  const schemaTypeRes = await fetch(API_LOCAL_PROCESSING_URLS.JSON_TO_TS, {
    body: JSON.stringify({
      body: record,
      name: typeName,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!schemaTypeRes.ok) {
    throw new Error("Failed to fetch TypeScript from JSON");
  }

  const schemaType = (await schemaTypeRes.json()) as string[];
  return schemaType.join("\n");
}

export async function superFetchTypesAndJSON({
  record,
  typeName,
}: {
  record: Record<string, any>;
  typeName: string;
}) {
  const ts = await fetchTypeScriptFromJSON({ record, typeName });
  const json = await fetchJSONFromTypeScript({ types: ts });

  const regex = new RegExp(typeName, "gi");

  return { json, ts: ts.replaceAll(regex, typeName) };
}
