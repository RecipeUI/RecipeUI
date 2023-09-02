import { superFetchTypesAndJSON } from "../../../fetchers/editor";
import { EditorSliceValues } from "../../../state/recipeSession";
import {
  API_LOCAL_PROCESSING_URLS,
  API_TYPE_NAMES,
} from "../../../utils/constants/main";

export async function getQueryAndBodyInfo({
  url,
  body,
}: {
  url: string;
  body?: string | null | undefined | Record<string, unknown>;
}) {
  const queryParams = new URL(url).searchParams;
  let queryInfo: Pick<
    EditorSliceValues,
    "editorQuerySchemaType" | "editorQuerySchemaJSON"
  > | null = null;

  if (queryParams.size > 0) {
    const queryRecord: Record<string, string> = {};

    queryParams.forEach((value, key) => {
      queryRecord[key] = value;
    });

    const _queryInfo = await superFetchTypesAndJSON({
      record: queryRecord,
      typeName: API_TYPE_NAMES.APIQueryParams,
    });

    queryInfo = {
      editorQuerySchemaType: _queryInfo.ts,
      editorQuerySchemaJSON: _queryInfo.json,
    };
  }

  let bodyInfo: Pick<
    EditorSliceValues,
    "editorBodySchemaType" | "editorBodySchemaJSON"
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
    };
  }

  return {
    queryInfo,
    bodyInfo,
  };
}
