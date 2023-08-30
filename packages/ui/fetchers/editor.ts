import { API_LOCAL_PROCESSING_URLS } from "../utils/constants/main";

interface FetchTypeScriptFromJSON {
  types: string;
}

export async function fetchTypeScriptFromJSON({
  types,
}: FetchTypeScriptFromJSON) {
  return fetch(API_LOCAL_PROCESSING_URLS.TS_TO_JSON, {
    body: JSON.stringify({ types }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
