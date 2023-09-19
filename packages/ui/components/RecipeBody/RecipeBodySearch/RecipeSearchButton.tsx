import classNames from "classnames";
import { useContext, useEffect, useRef } from "react";
import { UNIQUE_ELEMENT_IDS } from "../../../utils/constants/main";
import {
  FetchRequest,
  FetchResponse,
  RecipeContext,
  RecipeNativeFetchContext,
  RecipeOutputTab,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { AuthConfig, RecipeOptions, RecipeOutputType } from "types/database";
import {
  ContentType,
  RecipeAuthType,
  RecipeError,
  RecipeMutationContentType,
} from "types/enums";
import { useHover } from "usehooks-ts";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { SecretAPI } from "../../../state/apiSession/SecretAPI";
import { OutputAPI } from "../../../state/apiSession/OutputAPI";
import { parse } from "json5";
import { v4 as uuidv4 } from "uuid";
import { isCollectionModule } from "../../../modules";
import { ModuleSettings } from "../../../modules/authConfigs";
import { DISCORD_LINK } from "utils/constants";

export function RecipeSearchButton() {
  const posthog = usePostHog();
  const currentSession = useRecipeSessionStore((store) => store.currentSession);
  const requestBody = useRecipeSessionStore((store) => store.requestBody);
  const fileManager = useRecipeSessionStore((store) => store.fileManager);

  const isSending = useRecipeSessionStore((store) => store.isSending);
  const setIsSending = useRecipeSessionStore((store) => store.setIsSending);
  const queryParams = useRecipeSessionStore((store) => store.queryParams);
  const urlParams = useRecipeSessionStore((store) => store.urlParams);
  const fetchRejectRef = useRef<((val: any) => void) | null>(null);
  const _recipe = useContext(RecipeContext);

  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const editorMode = useRecipeSessionStore((state) => state.editorMode);
  const editorBody = useRecipeSessionStore((state) => state.editorBody);
  const editorBodyType = useRecipeSessionStore((state) => state.editorBodyType);
  const editorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.editorBodySchemaJSON
  );

  const editorHeaders = useRecipeSessionStore((state) => state.editorHeaders);
  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);
  const editorMethod = useRecipeSessionStore((state) => state.editorMethod);
  const editorAuthConfig = useRecipeSessionStore(
    (state) => state.editorAuthConfig
  );
  const editorQuery = useRecipeSessionStore((state) => state.editorQuery);
  const editorURLCode = useRecipeSessionStore((state) => state.editorURLCode);
  const isTauri = useIsTauri();

  const onSubmit = async () => {
    if (loadingTemplate) {
      alert("Please wait for the template to finish loading.");
    }
    // if (currentSession) OutputAPI.clearOutput(currentSession.id);

    const success = await _onSubmit();
    setTimeout(() => {
      setIsSending(
        false,
        success === undefined
          ? editorMode
            ? undefined
            : RecipeOutputTab.Docs
          : RecipeOutputTab.Output
      );
    }, 0);
  };

  const nativeFetch = useContext(RecipeNativeFetchContext)!;

  const editorProject = useRecipeSessionStore((state) => state.editorProject);

  const _onSubmit = async () => {
    if (!currentSession) return;

    const startTime = performance.now();
    const recipe = editorMode
      ? {
          id: currentSession.id,
          title: "API",
          project: "Personal",
          method: editorMethod,
          path: editorUrl,
          options: {},
          version: 1,
          authConfig: editorAuthConfig,
        }
      : _recipe!;

    const recipeInfoLog = {
      recipeId: recipe.id,
      path: recipe.path,
      project: recipe.project,
      title: recipe.title,
    };

    const outputId = uuidv4();

    if (isSending) {
      posthog?.capture(POST_HOG_CONSTANTS.RECIPE_ABORT, recipeInfoLog);
      fetchRejectRef.current?.(new Error(RecipeError.AbortedRequest));
      fetchRejectRef.current = null;

      // This isn't right
      OutputAPI.addOutput({
        sessionId: currentSession.id,
        sessionOutput: {
          output: {
            message: "Request aborted.",
          },
          type: RecipeOutputType.Response,
        },
      });

      return;
    }

    let fetchRequestBody: Record<string, unknown> | FormData | undefined =
      undefined;
    let fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let SCHEMA_CONTENT_TYPE = RecipeMutationContentType.JSON;

    let fetchMethod = recipe.method;
    let path = recipe.path;

    if (editorMode) {
      if (editorBodyType === RecipeMutationContentType.JSON && editorBody) {
        fetchRequestBody = parse(editorBody);
      }

      fetchHeaders = editorHeaders.reduce((acc, { name, value }) => {
        if (!name || value == undefined) return acc;

        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);

      if (editorBodyType) {
        SCHEMA_CONTENT_TYPE = editorBodyType;
      }
    } else {
      fetchRequestBody = requestBody;
    }

    // ------ Parse URL Params -------
    const matches = path.match(/{(\w+)}/g);
    if (matches && matches.length > 0) {
      try {
        const urlState = editorMode ? parse(editorURLCode) : urlParams;

        for (const key in urlState) {
          path = path.replace(`${key}`, urlState[key]);
        }

        // We should do some validation that the URL is clean now
        const recheckMatches = path.match(/{(\w+)}/g);
        if (recheckMatches && recheckMatches.length > 0) {
          alert("Detected URL params, but could not parse them.");
          return;
        }
      } catch (e) {
        alert("Detected URL params, but could not parse them.");
        return;
      }
    }

    let url = new URL(path);

    // ------ Parse Auth -------
    if (editorProject && isCollectionModule(editorProject)) {
      const { hasAuthSetup, secretRecord } = await SecretAPI.getComplexSecrets({
        collection: editorProject,
      });

      if (!hasAuthSetup) {
        alert("Please setup authentication first.");
        return false;
      }

      const authConfigs = ModuleSettings[editorProject]?.authConfigs || [];

      for (const config of authConfigs) {
        const secretKey = SecretAPI.getSecretKeyFromConfig(
          config,
          editorProject
        );
        let secretValue = secretRecord[secretKey];

        if (!secretValue) {
          // This really shouldn't happen because of hasAuthSetup
          alert(
            `Please setup authentication first for the API Key ${config.type}::${config.payload?.name}`
          );
          return false;
        }

        if (config.payload?.prefix) {
          secretValue = `${config.payload.prefix} ${secretValue}`;
        }

        if (config.type === RecipeAuthType.Query) {
          url.searchParams.append(config.payload.name, secretValue);
        } else if (config.type === RecipeAuthType.Header) {
          fetchHeaders[config.payload.name] = secretValue;
        }
      }
    }
    if (!isCollectionModule(editorProject || "") && recipe.authConfig) {
      for (let i = 0; i < recipe.authConfig.length; i++) {
        const config: AuthConfig = recipe.authConfig[i];

        const primaryToken = await SecretAPI.getSecret({
          secretId:
            recipe.authConfig.length === 1
              ? currentSession.recipeId
              : `${currentSession.recipeId}-${i}`,
        });

        if (!primaryToken) {
          alert("Please setup authentication first.");
          return false;
        }

        if (config.type === RecipeAuthType.Bearer) {
          fetchHeaders["Authorization"] = `Bearer ${primaryToken}`;
        }

        if (config.type === RecipeAuthType.Header) {
          const headerName = config.payload.name;
          fetchHeaders[headerName] = primaryToken;
        }

        if (config.type === RecipeAuthType.Query) {
          let QUERY_KEY_NAME = config.payload.name;
          url.searchParams.append(QUERY_KEY_NAME, primaryToken!);
        }
      }
    }

    // ------ Parse Request Body -------
    if (editorMode && fetchRequestBody) {
      if (
        Object.keys(fetchRequestBody).length <
        (editorBodySchemaJSON?.required?.length || 0)
      ) {
        alert("Please fill in all required fields.");
        return;
      }

      // TODO: Support form fields
    }

    // TODO: We can have very strict validation eventually

    // ------ Parse FORM DEPRECATED  -------
    // if (
    //   !editorMode &&
    //   "requestBody" in recipe &&
    //   recipe.requestBody &&
    //   "objectSchema" in recipe.requestBody &&
    //   recipe.requestBody.objectSchema
    // ) {
    //   const { objectSchema } = recipe.requestBody;
    //   const requiredKeys = objectSchema.filter(
    //     (schema) => schema.required === true
    //   );

    //   // TODO: Move this to terminal
    //   if (requiredKeys.length > Object.keys(requestBody).length) {
    //     alert("Please fill in all required fields.");
    //     return;
    //   }

    //   if (SCHEMA_CONTENT_TYPE === "application/json") {
    //     fetchRequestBody = requestBody;

    //     if (recipe.options?.streaming === true) {
    //       fetchRequestBody.stream = true;
    //     }
    //   } else if (SCHEMA_CONTENT_TYPE === "multipart/form-data") {
    //     // https://github.com/JakeChampion/fetch/issues/505#issuecomment-293064470
    //     delete fetchHeaders["Content-Type"];

    //     const formData = new FormData();

    //     for (const key in requestBody) {
    //       let payload = requestBody[key];

    //       if (typeof payload === "object" && payload !== null) {
    //         payload = JSON.stringify(payload);
    //       }

    //       if (key === "file") {
    //         // This only works well for 1 layer deep route. Think of something better when we bump into multi layer
    //         const file = fileManager[currentSession.id];
    //         if (!file) {
    //           alert("Please upload a file first.");
    //           return;
    //         }
    //         payload = file;
    //       }

    //       formData.append(key, payload as string | Blob);
    //     }
    //     fetchRequestBody = formData;
    //   }
    // }
    // ------ Parse FORM DEPRECATED  -------

    // ------ Parse Query Params -------
    const _queryParams = editorMode
      ? (parse(editorQuery || "{}") as Record<string, string>)
      : queryParams;

    for (const key in _queryParams) {
      const value = _queryParams[key];
      if (!value) continue;

      if (typeof value === "object") {
        url.searchParams.append(key, JSON.stringify(value));
        continue;
      }

      url.searchParams.append(key, String(value));
    }

    // ------ Clone Request for Code Generation -------
    let clonedBody =
      fetchRequestBody instanceof FormData
        ? { form: "File binary" }
        : structuredClone(fetchRequestBody);

    let clonedHeaders = structuredClone(fetchHeaders);
    let clonedUrl = new URL(path + url.search);

    let infoOptions: Record<string, unknown> = {};

    const requestInfo = {
      url: clonedUrl.toString(),
      payload: {
        method: fetchMethod,
        headers: clonedHeaders,
        body: clonedBody,
      },
      options: infoOptions,
    };

    if (
      !(fetchRequestBody instanceof FormData) &&
      typeof fetchRequestBody === "object"
    ) {
      if (Object.keys(fetchRequestBody).length === 0) {
        fetchRequestBody = undefined;
      }
    }

    try {
      setIsSending(true, RecipeOutputTab.Output);

      const payload = {
        method: fetchMethod,
        headers: fetchHeaders,
        ...(fetchRequestBody
          ? {
              body:
                SCHEMA_CONTENT_TYPE === "application/json"
                  ? JSON.stringify(fetchRequestBody)
                  : (fetchRequestBody as FormData | undefined),
            }
          : null),
      };

      posthog?.capture(POST_HOG_CONSTANTS.RECIPE_SUBMIT, recipeInfoLog);

      // ------ Fetch via Streaming -------
      // Streaming is unique edge case, but doesn't work with CORS. Migrate later eventually.
      if (
        (recipe.options &&
          "streaming" in recipe.options &&
          recipe.options.streaming === true) ||
        (fetchRequestBody &&
          "stream" in fetchRequestBody &&
          fetchRequestBody.stream === true)
      ) {
        const res = await fetch(url, payload);

        if (res.status >= 400) {
          const errorResponse = await res.json();

          if (errorResponse) {
            OutputAPI.addOutput({
              sessionId: currentSession.id,
              sessionOutput: {
                id: outputId,
                output:
                  typeof errorResponse === "string"
                    ? JSON.stringify(errorResponse)
                    : errorResponse,
                type: RecipeOutputType.Error,
              },
            });
            return false;
          }
        }
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
            const contentChunk = (chunk.choices[0].delta.content ?? "").replace(
              /^`\s*/,
              "`"
            );

            content = `${content}${contentChunk}`;

            OutputAPI.addOutput({
              sessionId: currentSession.id,
              sessionOutput: {
                id: outputId,
                output: {
                  content,
                },
                type: RecipeOutputType.Streaming,
              },
            });
          }
        }

        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headers[key] = value;
        });

        OutputAPI.addOutput({
          sessionId: currentSession.id,
          sessionOutput: {
            id: outputId,
            output: {
              content,
            },
            created_at: new Date().toISOString(),
            type: RecipeOutputType.Response,
            duration: performance.now() - startTime,
            requestInfo,
            contentType: ContentType.JSON,
            responseInfo: {
              status: res.status,
              headers: headers,
              duration: performance.now() - startTime,
            },
          },
        });

        posthog?.capture(
          POST_HOG_CONSTANTS.RECIPE_SUBMIT_SUCCESS,
          recipeInfoLog
        );

        return true;
      }

      // ------ Fetch Request ------
      const {
        contentType,
        status,
        output: outputStr,
        headers,
      } = await new Promise<FetchResponse>((resolve, reject) => {
        fetchRejectRef.current = reject;

        // Prefer browser fetch if we can.
        function simpleFetch() {
          fetch(url.toString(), payload)
            .then(async (res) => {
              const headers: Record<string, string> = {};
              res.headers.forEach((value, key) => {
                headers[key] = value;
              });

              resolve({
                output: await res.text(),
                status: res.status,
                contentType: res.headers.get("content-type") ?? "text/plain",
                headers: headers,
              });
            })
            .catch(reject);
        }

        if (
          payload.body instanceof FormData ||
          !nativeFetch ||
          (!isTauri && url.origin.startsWith("http://localhost"))
        ) {
          simpleFetch();
          return;
        }

        const fetchPayload: FetchRequest = {
          url: url.toString(),
          // @ts-expect-error Wrongly inferring body as formdata
          payload: {
            ...payload,
            ...(payload.body ? { body: payload.body as string } : null),
          },
        };

        nativeFetch(fetchPayload)
          .then((res) => {
            resolve(res);
          })
          .catch(reject);
      });

      // ------ Parse Response -------
      let output: Record<string, unknown> = {};
      const isStatusOk = status >= 200 && status < 300;
      console.debug({ output, status });

      let hasParsed = false;
      if (contentType?.includes("text/")) {
        output = { text: outputStr };
        hasParsed = true;
      } else {
        try {
          output = parse(outputStr);
          hasParsed = true;
        } catch (e) {
          output = { response: "unable to parse json" };
        }
      }

      if (!isStatusOk && !hasParsed) {
        const statusPrefix = `Error code ${status}.`;
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

      posthog?.capture(
        // The ok read-only property of the Response interface contains a Boolean stating whether the response was successful (status in the range 200-299) or not.
        isStatusOk
          ? POST_HOG_CONSTANTS.RECIPE_SUBMIT_SUCCESS
          : POST_HOG_CONSTANTS.RECIPE_SUBMIT_FAILURE,
        recipeInfoLog
      );

      OutputAPI.addOutput({
        sessionId: currentSession.id,
        sessionOutput: {
          id: outputId,
          output: output,
          created_at: new Date().toISOString(),
          type: isStatusOk ? RecipeOutputType.Response : RecipeOutputType.Error,
          duration: performance.now() - startTime,
          requestInfo,
          contentType: contentType as ContentType,
          responseInfo: {
            status: status,
            headers: headers,
            duration: performance.now() - startTime,
          },
        },
      });
    } catch (e) {
      console.error(e);
      let output = `Is this error unexpected? Debug with inspector window or report in our discord ${DISCORD_LINK}.`;

      if ((e as Error)?.message === RecipeError.AbortedRequest) {
        output = "Request cancelled.";
      }

      let errorMessage: string = "";

      try {
        if (e instanceof Error) {
          errorMessage = e.message;
        } else {
          errorMessage = parse(e as any);
        }
      } catch (_) {
        //
      }

      posthog?.capture(POST_HOG_CONSTANTS.RECIPE_SUBMIT_FAILURE, recipeInfoLog);

      OutputAPI.addOutput({
        sessionId: currentSession.id,
        sessionOutput: {
          id: outputId,
          output: errorMessage
            ? {
                error: errorMessage,
                response: output,
              }
            : {
                error: output,
              },
          type: RecipeOutputType.Error,
          duration: performance.now() - startTime,
        },
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
          isTauri && "tooltip tooltip-left"
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
