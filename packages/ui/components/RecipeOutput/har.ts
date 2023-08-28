import { HTTPSnippet } from "httpsnippet";
import {
  CodeView,
  RecipeRequestInfo,
  ConvertTargets,
} from "../../state/recipeSession";
import { useCallback, useMemo } from "react";

const CONVERT_OPTIONS: {
  lang: ConvertTargets;
  codeView: CodeView;
  mode: string;
}[] = [
  {
    codeView: CodeView.CURL,
    lang: "shell",
    mode: "curl",
  },
  {
    codeView: CodeView.JavaScriptAxios,
    lang: "javascript",
    mode: "axios",
  },
  {
    codeView: CodeView.JavaScriptFetch,
    lang: "javascript",
    mode: "fetch",
  },
  {
    codeView: CodeView.PythonHttpClient,
    lang: "python",
    mode: "python3",
  },
  {
    codeView: CodeView.PythonRequestLib,
    lang: "python",
    mode: "requests",
  },
];

export const useGenerateSnippet = (
  codeView: CodeView,
  requestInfo?: RecipeRequestInfo
) => {
  const formatedHeaders = useMemo(() => {
    if (!requestInfo) return [];
    const _headers = Object.entries(requestInfo.payload.headers).map(
      ([key, value]) => {
        return { name: key, value };
      }
    );
    return _headers;
  }, [requestInfo]);

  const queryString = useMemo(() => {
    if (!requestInfo) return [];
    const params = [];
    for (const [key, value] of requestInfo.url.searchParams.entries()) {
      params.push({ name: key, value });
    }
    return params;
  }, [requestInfo]);

  const url = useMemo(() => {
    if (!requestInfo) return "";
    return requestInfo.url.origin + requestInfo?.url.pathname;
  }, [requestInfo]);

  const buildPostData = useCallback(() => {
    if (!requestInfo) return { mimeType: "application/json" };
    const body = requestInfo.payload.body;
    if (typeof body === "object" && body !== null) {
      return {
        mimeType: "application/json",
        text: JSON.stringify(body),
      };
    }
    return { mimeType: "application/json" };
  }, [requestInfo]);

  const converted = useMemo(() => {
    const snippet = new HTTPSnippet({
      method: requestInfo?.payload.method ?? "GET",
      headers: formatedHeaders,
      url: url,
      httpVersion: "HTTP/1.1",
      // No Cookie support
      cookies: [],
      queryString: queryString,
      headersSize: -1,
      bodySize: -1,
      postData: buildPostData(),
      // postData: [],
    });
    const option = CONVERT_OPTIONS.find(
      (option) => option.codeView === codeView
    );
    if (!option) return snippet.convert("shell", "curl") as string;
    return snippet.convert(option?.lang, option?.mode) as string;
  }, [buildPostData, codeView, formatedHeaders, queryString, requestInfo, url]);

  return converted;
};
