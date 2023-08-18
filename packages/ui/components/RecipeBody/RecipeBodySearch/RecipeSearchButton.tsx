import classNames from "classnames";
import { useContext, useEffect, useRef } from "react";
import {
  RECIPE_PROXY,
  UNIQUE_ELEMENT_IDS,
} from "../../../utils/constants/main";
import { useSecretsFromSM } from "../../../state/recipeAuth";
import {
  FetchRequest,
  FetchResponse,
  RecipeContext,
  RecipeNativeFetch,
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeOutputType } from "types/database";
import { RecipeAuthType, RecipeError } from "types/enums";
import { useHover } from "usehooks-ts";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { isTauri } from "../../../utils/main";

export function RecipeSearchButton() {
  const posthog = usePostHog();
  const currentSession = useRecipeSessionStore((store) => store.currentSession);
  const requestBody = useRecipeSessionStore((store) => store.requestBody);
  const setOutput = useRecipeSessionStore((store) => store.updateOutput);
  const clearOutput = useRecipeSessionStore((store) => store.clearOutput);
  const fileManager = useRecipeSessionStore((store) => store.fileManager);

  const isSending = useRecipeSessionStore((store) => store.isSending);
  const setIsSending = useRecipeSessionStore((store) => store.setIsSending);
  const queryParams = useRecipeSessionStore((store) => store.queryParams);
  const urlParams = useRecipeSessionStore((store) => store.urlParams);
  const fetchRejectRef = useRef<((val: any) => void) | null>(null);
  const recipe = useContext(RecipeContext)!;

  const secretInfo = useSecretsFromSM();
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const onSubmit = async () => {
    if (currentSession) clearOutput(currentSession.id);

    const success = await _onSubmit();
    setTimeout(() => {
      setIsSending(
        false,
        success === undefined ? RecipeOutputTab.Docs : RecipeOutputTab.Output
      );
    }, 500);
  };

  const nativeFetch = useContext(RecipeNativeFetch)!;
  const _onSubmit = async () => {
    if (!currentSession) return;

    if (loadingTemplate) {
      alert("Please wait for the template to finish loading.");
      return;
    }

    const startTime = performance.now();

    const recipeInfoLog = {
      recipeId: recipe.id,
      path: recipe.path,
      project: recipe.project,
      title: recipe.title,
    };

    if (isSending) {
      posthog.capture(POST_HOG_CONSTANTS.RECIPE_ABORT, recipeInfoLog);
      fetchRejectRef.current?.(new Error(RecipeError.AbortedRequest));
      fetchRejectRef.current = null;

      setOutput(currentSession.id, {
        output: {
          message: "Request aborted.",
        },
        type: RecipeOutputType.Response,
      });

      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let path = recipe.path;

    if ("urlParams" in recipe && recipe.urlParams != undefined) {
      for (const { name: key, ...schema } of recipe.urlParams) {
        const value = urlParams[key];
        if (value == undefined || value === "") {
          const isRequired = schema.required;
          // By default URL params are usually required if someone forgot to define
          if (isRequired === undefined || isRequired) {
            alert(`Please provide a value for ${key}`);
            return;
          } else {
            path = path.replace(`/{${key}}`, "");
          }
        } else {
          path = path.replace(`{${key}}`, String(value));
        }

        path = path.replace(`{${key}}`, String(value));
      }
    }

    let url = new URL(path);

    if (recipe.auth) {
      if (!secretInfo?.hasAllSecrets) {
        alert("Please setup authentication first.");
        return;
      }

      const primaryToken = secretInfo.secrets[recipe.auth];

      if (recipe.auth === RecipeAuthType.Bearer) {
        headers["Authorization"] = `Bearer ${primaryToken}`;
      }

      if (recipe.auth === RecipeAuthType.Query) {
        // Need to find name of query param
        const QUERY_KEY_NAME = recipe.options?.auth?.find(
          (auth) => auth.type === RecipeAuthType.Query
        )?.payload.name;

        if (!QUERY_KEY_NAME) {
          alert(
            "The auth for this recipe is not setup correctly. Please contact us at team@recipeui.com"
          );
          return;
        }

        url.searchParams.append(QUERY_KEY_NAME, primaryToken!);
      }

      if (recipe.auth === RecipeAuthType.ClientID) {
        headers["Authorization"] = `Client-ID ${primaryToken}`;
      }

      if (recipe.auth === RecipeAuthType.Token) {
        headers["Authorization"] = `Token ${primaryToken}`;
      }

      if (recipe.auth === RecipeAuthType.Custom) {
        for (const simpleHeader of secretInfo.simpleHeaders) {
          headers[simpleHeader] = secretInfo.secrets[simpleHeader]!;
        }
      }
    }
    let body: undefined | Record<string, unknown> | FormData;
    const SCHEMA_CONTENT_TYPE =
      "requestBody" in recipe && recipe.requestBody?.contentType;

    // TODO: We can have very strict validation eventually
    if (
      "requestBody" in recipe &&
      recipe.requestBody &&
      "objectSchema" in recipe.requestBody &&
      recipe.requestBody.objectSchema
    ) {
      const { objectSchema } = recipe.requestBody;
      const requiredKeys = objectSchema.filter(
        (schema) => schema.required === true
      );

      // TODO: Move this to terminal
      if (requiredKeys.length > Object.keys(requestBody).length) {
        alert("Please fill in all required fields.");
        return;
      }

      const _requestBody = { ...requestBody };
      if (recipe.options?.streaming === true) {
        _requestBody.stream = true;
      }

      if (SCHEMA_CONTENT_TYPE === "application/json") {
        body = _requestBody;
      } else if (SCHEMA_CONTENT_TYPE === "multipart/form-data") {
        // https://github.com/JakeChampion/fetch/issues/505#issuecomment-293064470
        delete headers["Content-Type"];

        const formData = new FormData();

        for (const key in _requestBody) {
          let payload = _requestBody[key];

          if (typeof payload === "object" && payload !== null) {
            payload = JSON.stringify(payload);
          }

          if (key === "file") {
            // This only works well for 1 layer deep route. Think of something better when we bump into multi layer
            const file = fileManager[currentSession.id];
            if (!file) {
              alert("Please upload a file first.");
              return;
            }
            payload = file;
          }

          formData.append(key, payload as string | Blob);
        }
        body = formData;
      }
    }

    for (const key in queryParams) {
      const value = queryParams[key];
      if (!value) continue;

      if (typeof value === "object") {
        url.searchParams.append(key, JSON.stringify(value));
        continue;
      }

      url.searchParams.append(key, String(value));
    }

    // We need to reformat it as it was originally

    let clonedBody = structuredClone(body);
    let clonedHeaders = structuredClone(headers);
    let clonedUrl = new URL(path + url.search);

    let infoOptions: Record<string, unknown> = {};

    if (clonedBody && "stream" in clonedBody) {
      infoOptions.stream = clonedBody.stream;
      delete clonedBody.stream;
    }

    if ("recipe-domain" in headers) {
      infoOptions.cors = true;
      delete clonedHeaders["recipe-domain"];
    }

    const requestInfo = {
      url: clonedUrl,
      payload: {
        method: recipe.method,
        headers: clonedHeaders,
        body: clonedBody,
      },
      options: infoOptions,
    };

    try {
      setIsSending(true, RecipeOutputTab.Output);

      const payload = {
        method: recipe.method,
        headers,
        body:
          SCHEMA_CONTENT_TYPE === "application/json"
            ? JSON.stringify(body)
            : (body as FormData | undefined),
      };

      posthog.capture(POST_HOG_CONSTANTS.RECIPE_SUBMIT, recipeInfoLog);

      // Streaming is unique edge case. We'll have to port this over to Server's later
      if (recipe.options?.streaming === true) {
        const res = await fetch(url, payload);
        let content = "";
        const textDecoder = new TextDecoder("utf-8");

        if (!res.body) {
          throw new Error("No body found.");
        }

        let reader = res.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const decodedData = textDecoder.decode(value);
          const lines = decodedData.split(/(\n){2}/);
          const chunks = lines
            .map((line) => line.replace(/(\n)?^data:\s*/, "").trim())
            .filter((line) => line !== "" && line !== "[DONE]")
            .map((line) => JSON.parse(line));

          for (const chunk of chunks) {
            // Avoid empty line after single backtick
            const contentChunk = (chunk.choices[0].delta.content ?? "").replace(
              /^`\s*/,
              "`"
            );

            content = `${content}${contentChunk}`;

            setOutput(currentSession.id, {
              output: {
                content,
              },
              type: RecipeOutputType.Streaming,
            });
          }
        }

        setOutput(currentSession.id, {
          output: {
            content,
          },
          type: RecipeOutputType.Response,
          duration: performance.now() - startTime,
          requestInfo,
        });

        posthog.capture(
          POST_HOG_CONSTANTS.RECIPE_SUBMIT_SUCCESS,
          recipeInfoLog
        );

        return true;
      }

      // ------ Actual Fetch Request ------
      const {
        contentType,
        status,
        output: outputStr,
      } = await new Promise<FetchResponse>((resolve, reject) => {
        fetchRejectRef.current = reject;

        // Prefer browser fetch if we can.
        function simpleFetch() {
          fetch(url, payload)
            .then(async (res) => {
              resolve({
                output: await res.text(),
                status: res.status,
                contentType: res.headers.get("content-type") ?? "text/plain",
              });
            })
            .catch(reject);
        }

        if (payload.body instanceof FormData || !nativeFetch) {
          // TODO: Make these work with native fetch
          simpleFetch();
          return;
        }

        const fetchPayload: FetchRequest = {
          url: url.toString(),
          payload: {
            ...payload,
            body: payload.body || undefined,
          },
        };

        // If we have to deal with CORS, then we need a server or proxy.
        if (recipe.options?.cors === true) {
          nativeFetch(fetchPayload).then(resolve).catch(reject);
          return;
        }

        simpleFetch();
      });

      let output: Record<string, unknown> = {};
      const isStatusOk = status >= 200 && status < 300;

      if (contentType?.includes("application/json")) {
        try {
          output = JSON.parse(outputStr);
        } catch (e) {
          output = { response: "unable to parse json" };
        }
      } else if (contentType?.includes("text/plain")) {
        output = { response: outputStr };
      } else {
        const statusPrefix = `Error code ${status}.`;
        if (!isStatusOk) {
          if ([401, 403, 405, 406].includes(status)) {
            output = {
              error: `${statusPrefix} Your authentication might no longer be valid for this endpoint.`,
            };
          } else if (status === 400) {
            output = {
              error: `${statusPrefix} Something went wrong with the request, but we're unable to get more info.`,
            };
          } else if (status === 404) {
            output = {
              error: `${statusPrefix} No resource found here, double check you parameters.`,
            };
          } else {
            output = {
              error: `${statusPrefix} Unable to figure out what went wrong with this request.`,
            };
          }
        }
      }

      posthog.capture(
        // The ok read-only property of the Response interface contains a Boolean stating whether the response was successful (status in the range 200-299) or not.
        isStatusOk
          ? POST_HOG_CONSTANTS.RECIPE_SUBMIT_SUCCESS
          : POST_HOG_CONSTANTS.RECIPE_SUBMIT_FAILURE,
        recipeInfoLog
      );

      setOutput(currentSession.id, {
        output: output,
        type: isStatusOk ? RecipeOutputType.Response : RecipeOutputType.Error,
        duration: performance.now() - startTime,
        requestInfo,
      });
    } catch (e) {
      let output =
        "Something went wrong. Can you report this issue to us at team@recipeui.com";

      if ((e as Error)?.message === RecipeError.AbortedRequest) {
        output = "Request cancelled.";
      }

      posthog.capture(POST_HOG_CONSTANTS.RECIPE_SUBMIT_FAILURE, recipeInfoLog);

      setOutput(currentSession.id, {
        output: {
          error: output,
        },
        type: RecipeOutputType.Error,
        duration: performance.now() - startTime,
      });
    }
    return true;
  };

  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        ref.current?.click();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isHovering = useHover(ref);

  return (
    <div>
      <button
        id={UNIQUE_ELEMENT_IDS.RECIPE_SEARCH}
        ref={ref}
        className={classNames(
          "btn btn-accent dark:text-white sm:w-24 w-full !text-black",
          !currentSession && "btn-disabled",
          isSending && "hover:btn-error",
          isTauri() && "tooltip tooltip-left"
        )}
        data-tip="CMD+Enter"
        type="button"
        onClick={onSubmit}
      >
        {isSending ? (
          isHovering ? (
            <span>Stop</span>
          ) : (
            <span className="loading loading-infinity"></span>
          )
        ) : (
          <span>Send</span>
        )}
      </button>
    </div>
  );
}
