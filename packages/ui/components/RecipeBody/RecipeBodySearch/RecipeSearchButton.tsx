import classNames from "classnames";
import { useContext, useEffect, useRef } from "react";
import { UNIQUE_ELEMENT_IDS } from "../../../utils/constants/main";
import {
  FetchRequest,
  FetchResponse,
  RecipeContext,
  RecipeNativeFetchContext,
  RecipeOutputTab,
  RecipeRequestInfo,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { AuthConfig, RecipeOutputType, SingleAuthConfig } from "types/database";
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
import { ModuleSettings } from "../../../modules/authConfigs";
import { DISCORD_LINK } from "utils/constants";
import { getCollectionModule } from "types/modules/helpers";
import {
  convertFormDataToObject,
  convertObjectToFormData,
} from "../../../utils/main";
import { imageRegex } from "utils/constants/regex";

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
  const editorSessionOptions = useRecipeSessionStore(
    (state) => state.editorSessionOptions
  );

  const isTauri = useIsTauri();

  const onSubmit = async () => {
    if (loadingTemplate) {
      alert("Please wait for the template to finish loading.");
    }
    // if (currentSession) OutputAPI.clearOutput(currentSession.id);

    try {
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
    } catch (e) {
      alert((e as Error).message);

      console.error(e);
    }
  };

  const nativeFetch = useContext(RecipeNativeFetchContext)!;

  const editorProject = useRecipeSessionStore((state) => state.editorProject);

  const _onSubmit = async () => {
    if (!currentSession) return;

    const startTime = performance.now();
    const recipe = editorMode
      ? {
          id: currentSession.recipeId,
          title: "API",
          project: "Personal",
          method: editorMethod,
          path: editorUrl,
          options: editorSessionOptions,
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

    let fetchRequestBody: Record<string, unknown> | undefined = undefined;
    let fetchHeaders: Record<string, string> = {};

    if (editorBodyType) {
      if (editorBodyType === RecipeMutationContentType.JSON) {
        fetchHeaders["content-type"] = "application/json";
      } else {
        fetchHeaders["content-type"] = "multipart/form";
      }
    }

    let fetchMethod = recipe.method;
    let path = recipe.path;

    if (editorMode) {
      if (editorBody) {
        fetchRequestBody = parse(editorBody);
      }

      fetchHeaders = editorHeaders.reduce((acc, { name, value }) => {
        if (!name || value == undefined) return acc;

        acc[name.toLowerCase()] = value;
        return acc;
      }, fetchHeaders);
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

    let url: URL;
    try {
      url = new URL(path);
    } catch (e) {
      alert("Invalid URL. You might need to add http:// or https://");
      return;
    }

    // ------ Parse Auth -------

    const collectionModule = getCollectionModule({
      project: editorProject,
      options: recipe.options,
    });

    function processConfig(config: SingleAuthConfig, _secretValue: string) {
      let secretValue = _secretValue;

      if (config.payload && "prefix" in config.payload) {
        secretValue = `${config.payload.prefix} ${secretValue}`;
      }

      if (config.type === RecipeAuthType.Query) {
        url.searchParams.append(config.payload.name, secretValue);
      } else if (config.type === RecipeAuthType.Header) {
        fetchHeaders[config.payload.name] = secretValue;
      } else if (config.type === RecipeAuthType.Bearer) {
        fetchHeaders["Authorization"] = `Bearer ${secretValue}`;
      } else if (config.type === RecipeAuthType.Basic) {
        fetchHeaders["Authorization"] = `Basic ${secretValue}`;
      } else if (config.type === RecipeAuthType.OAuth2) {
        if (
          config.payload.token_type?.toLowerCase() === RecipeAuthType.Bearer
        ) {
          fetchHeaders["Authorization"] = `Bearer ${secretValue}`;
        } else if (config.payload.token_type) {
          fetchHeaders[
            "Authorization"
          ] = `${config.payload.token_type[0].toUpperCase()}${config.payload.token_type.slice(
            1
          )} ${secretValue}`;
        }
      }
    }

    if (collectionModule) {
      const { hasAuthSetup, secretRecord } = await SecretAPI.getComplexSecrets({
        collection: collectionModule,
      });

      if (!hasAuthSetup) {
        alert("Please setup authentication first.");
        return false;
      }

      let authConfigs: SingleAuthConfig[] = [];
      const initialConfig = ModuleSettings[collectionModule]?.authConfig;

      if (initialConfig) {
        if (initialConfig.type === RecipeAuthType.Multiple) {
          authConfigs = initialConfig.payload;
        } else {
          authConfigs = [initialConfig];
        }
      }

      for (const config of authConfigs) {
        const secretKey = SecretAPI.getSecretKeyFromConfig(
          config,
          collectionModule
        );
        let secretValue = secretRecord[secretKey];

        if (!secretValue) {
          // This really shouldn't happen because of hasAuthSetup
          alert(
            `Please setup authentication first for the API Key ${config.type}::${config.payload?.name}`
          );
          return false;
        }

        processConfig(config, secretValue);
      }
    }

    if (!collectionModule && recipe.authConfig) {
      let authConfigs: SingleAuthConfig[] =
        recipe.authConfig.type === RecipeAuthType.Multiple
          ? recipe.authConfig.payload
          : [recipe.authConfig];

      if (authConfigs.length > 0) {
        for (let i = 0; i < authConfigs.length; i++) {
          const config: AuthConfig = authConfigs[i];

          const primaryToken = await SecretAPI.getSecret({
            secretId: recipe.id,
            index:
              recipe.authConfig.type === RecipeAuthType.Multiple
                ? i
                : undefined,
          });

          if (!primaryToken) {
            alert("Please setup authentication first.");
            return false;
          }

          processConfig(config, primaryToken);
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
    let clonedBody = structuredClone(fetchRequestBody);

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
    } satisfies RecipeRequestInfo;

    if (typeof fetchRequestBody === "object") {
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
                typeof fetchRequestBody === "object" &&
                !(fetchRequestBody instanceof FormData)
                  ? JSON.stringify(fetchRequestBody)
                  : (fetchRequestBody as FormData | undefined),
              body_type: editorBodyType || undefined,
            }
          : {
              body: undefined,
            }),
      } satisfies FetchRequest["payload"];

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
          const simplePayload = {
            ...payload,
          };

          if (
            payload.headers["content-type"].includes("form") &&
            simplePayload.body
          ) {
            simplePayload.body = convertObjectToFormData(
              fetchRequestBody as Record<string, unknown>
            );

            delete simplePayload.headers["content-type"];
          }

          fetch(url.toString(), simplePayload)
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

        const urlString = url.toString();

        if (urlString.match(imageRegex)) {
          const contentType = urlString.split(".").pop() || "image/png";
          resolve({
            contentType,
            status: 200,
            output: JSON.stringify({
              recipeui_text: "This endpoint returns an image file.",
              url: urlString,
            }),
            headers: {
              "content-type": contentType,
            },
          });
        }

        if (
          !nativeFetch ||
          (!isTauri && url.origin.startsWith("http://localhost"))
        ) {
          simpleFetch();
          return;
        }

        // Can't pass FormData to Tauri or ServerActions
        const fetchPayload: FetchRequest = {
          url: url.toString(),
          payload: {
            ...payload,
            ...(payload.body
              ? payload.body instanceof FormData
                ? {
                    body: JSON.stringify(convertFormDataToObject(payload.body)),
                  }
                : { body: payload.body as string }
              : null),
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
      } else if (contentType?.includes("xml")) {
        hasParsed = true;
        output = {
          xml: outputStr,
        };
      } else {
        try {
          output = parse(outputStr);
          hasParsed = true;
        } catch (e) {
          output = { response: "unable to parse json", content: outputStr };
        }
      }

      if (!isStatusOk && (!hasParsed || (hasParsed && !outputStr))) {
        const statusPrefix = `Error code ${status}.`;
        if ([401, 403, 405, 406].includes(status)) {
          output = {
            error: `${statusPrefix} Your authentication might no longer be valid for this endpoint or your parameters are wrong.`,
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
