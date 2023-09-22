import { RecipeMutationContentType } from "types/enums";
import { superFetchTypesAndJSON } from "../../../fetchers/editor";
import { EditorSliceValues } from "../../../state/recipeSession";
import { API_LOCAL_PROCESSING_URLS } from "../../../utils/constants/main";
import { API_TYPE_NAMES } from "../../../utils/constants/recipe";

export async function getQueryAndBodyInfo({
  url,
  body,
}: {
  url: string;
  body?: string | null | undefined | Record<string, unknown>;
}) {
  let queryInfo: Pick<
    EditorSliceValues,
    "editorQuerySchemaType" | "editorQuerySchemaJSON" | "editorQuery"
  > | null = null;

  try {
    const urlParam = new URL(url);

    if (urlParam.search.length > 1) {
      const queryRecord: Record<string, string> = {};
      const searchParts = urlParam.search.substring(1).split("&");
      searchParts.forEach((part) => {
        const [key, value] = part.split("=");
        queryRecord[key] = value;
      });

      const _queryInfo = await superFetchTypesAndJSON({
        record: queryRecord,
        typeName: API_TYPE_NAMES.APIQueryParams,
      });

      queryInfo = {
        editorQuerySchemaType: _queryInfo.ts,
        editorQuerySchemaJSON: _queryInfo.json,
        editorQuery: JSON.stringify(queryRecord, null, 2),
      };
    }
  } catch (e) {
    console.error("Type error");
    throw e;
  }

  let bodyInfo: Pick<
    EditorSliceValues,
    | "editorBodySchemaType"
    | "editorBodySchemaJSON"
    | "editorBody"
    | "editorBodyType"
  > | null = null;
  if (body) {
    const requestBody = typeof body === "string" ? JSON.parse(body) : body;

    const _bodyInfo = await superFetchTypesAndJSON({
      record: requestBody,
      typeName: API_TYPE_NAMES.APIRequestParams,
    });

    bodyInfo = {
      editorBodySchemaType: _bodyInfo.ts,
      editorBodySchemaJSON: _bodyInfo.json,
      editorBody: JSON.stringify(requestBody, null, 2),
      editorBodyType: RecipeMutationContentType.JSON, //TODO: Rethink this for forms
    };
  }

  return {
    queryInfo,
    bodyInfo,
  };
}
