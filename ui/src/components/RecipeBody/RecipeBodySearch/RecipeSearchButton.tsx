import classNames from "classnames";
import { useContext, useEffect, useRef } from "react";
import { RECIPE_PROXY } from "@/utils/constants";
import { useSecretManager, useSecretsFromSM } from "@/state/recipeAuth";
import {
  RecipeBodyRoute,
  RecipeContext,
  RecipeOutputTab,
  RecipeOutputType,
  useRecipeSessionStore,
} from "@/state/recipeSession";
import {
  RecipeAuthType,
  RecipeParam,
  RecipeParamType,
  RecipeStringParam,
} from "@/types/databaseExtended";
import { useHover } from "usehooks-ts";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "@/utils/posthogConstants";
import { getVariedParamInfo } from "@/components/RecipeOutput/RecipeDocs";

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
  const controllerRef = useRef<AbortController | null>(null);
  const recipe = useContext(RecipeContext)!;

  const secretInfo = useSecretsFromSM();

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

  const _onSubmit = async () => {
    if (!currentSession) return;

    const startTime = performance.now();

    const recipeInfoLog = {
      recipeId: recipe.id,
      path: recipe.path,
      project: recipe.project,
      title: recipe.title,
    };

    if (isSending) {
      posthog.capture(POST_HOG_CONSTANTS.RECIPE_ABORT, recipeInfoLog);
      controllerRef.current?.abort();
      controllerRef.current = null;
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
        if (value === undefined) {
          const isRequired = schema.required;
          // By default URL params are usually required if someone forgot to define
          if (isRequired === undefined || isRequired) {
            alert(`Please provide a value for ${key}`);
            return;
          } else {
            path = path.replace(`{${key}}`, "");
          }
        } else {
          path = path.replace(`{${key}}`, String(value));
        }

        path = path.replace(`{${key}}`, String(value));
      }
    }

    let url = new URL(path);
    // TODO: Should we just make this the default so no one deals with this problem?
    // TODO: We actually don't need this anymore with server actions. Kinda insane...
    if (recipe.options?.cors === true) {
      headers["recipe-domain"] = url.origin;
      url = new URL(RECIPE_PROXY + url.pathname);
    }

    if (recipe.auth) {
      if (!secretInfo?.hasAllSecrets) {
        alert("Please setup authentication first.");
        return;
      }

      const primaryToken = secretInfo.secrets[recipe.auth];

      if (recipe.auth === RecipeAuthType.Bearer) {
        headers["Authorization"] = `Bearer ${primaryToken}`;
      }

      if (recipe.auth.includes("query")) {
        url.searchParams.append(recipe.auth.split("=")[1], primaryToken!);
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
    let body: undefined | string | FormData;

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

      const contentType = recipe.requestBody.contentType;

      if (contentType === "application/json") {
        body = JSON.stringify(_requestBody);
      } else if (contentType === "multipart/form-data") {
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

    try {
      controllerRef.current = new AbortController();

      setIsSending(true, RecipeOutputTab.Output);

      const payload = {
        method: recipe.method,
        headers,
        body,
        signal: controllerRef.current.signal,
      };

      posthog.capture(POST_HOG_CONSTANTS.RECIPE_SUBMIT, recipeInfoLog);

      const res = await fetch(url, payload);

      if (res.body && recipe.options?.streaming === true) {
        let content = "";
        const textDecoder = new TextDecoder("utf-8");

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
        });

        posthog.capture(
          POST_HOG_CONSTANTS.RECIPE_SUBMIT_SUCCESS,
          recipeInfoLog
        );

        return true;
      }

      let output: Record<string, unknown> = {};

      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        output = await res.json();
      } else if (contentType?.includes("text/plain")) {
        output = { response: await res.text() };
      } else {
        const statusPrefix = `Error code ${res.status}.`;
        if (!res.ok) {
          if ([401, 403, 405, 406].includes(res.status)) {
            output = {
              error: `${statusPrefix} Your authentication might no longer be valid for this endpoint.`,
            };
          } else if (res.status === 400) {
            output = {
              error: `${statusPrefix} Something went wrong with the request, but we're unable to get more info.`,
            };
          } else if (res.status === 404) {
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
        res.ok
          ? POST_HOG_CONSTANTS.RECIPE_SUBMIT_SUCCESS
          : POST_HOG_CONSTANTS.RECIPE_SUBMIT_FAILURE,
        recipeInfoLog
      );

      setOutput(currentSession.id, {
        output: output,
        type: res.ok ? RecipeOutputType.Response : RecipeOutputType.Error,
        duration: performance.now() - startTime,
      });
    } catch (e) {
      console.error(e);
      let output =
        "Something went wrong. Can you report this issue to us at team@recipeui.com";

      if ("name" in (e as Error) && (e as Error).name === "AbortError") {
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

  useLoadingTemplate();

  const isHovering = useHover(ref);

  return (
    <div className="tooltip tooltip-bottom">
      <button
        ref={ref}
        className={classNames(
          "btn btn-accent dark:text-white sm:w-24 w-full !text-black",
          !currentSession && "btn-disabled",
          isSending && "hover:btn-error"
        )}
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

function useLoadingTemplate() {
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const session = useRecipeSessionStore((state) => state.currentSession)!;
  const setOutput = useRecipeSessionStore((state) => state.updateOutput);
  const clearOutput = useRecipeSessionStore((state) => state.clearOutput);
  const setIsSending = useRecipeSessionStore((state) => state.setIsSending);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const setOutputTab = useRecipeSessionStore((state) => state.setOutputTab);

  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);

  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );
  const updateQueryParams = useRecipeSessionStore(
    (state) => state.updateQueryParams
  );
  const updateUrlParams = useRecipeSessionStore(
    (state) => state.updateUrlParams
  );

  const selectedRecipe = useContext(RecipeContext)!;

  useEffect(() => {
    if (!loadingTemplate) return;

    const { replay, requestBody, queryParams, urlParams } = loadingTemplate;

    let t = 0;

    function updateMagic({
      paramName,
      paramValue,
      paramSchema,
      updateFunction,
      path,
      speedFactor = 1,
    }: {
      paramName: string;
      paramValue: unknown;
      paramSchema: RecipeParam;

      path: string;
      updateFunction:
        | typeof updateRequestBody
        | typeof updateQueryParams
        | typeof updateUrlParams;

      speedFactor: number;
    }) {
      if (
        paramSchema.type === RecipeParamType.Array &&
        Array.isArray(paramValue)
      ) {
        setTimeout(() => {
          updateFunction({
            path: path + paramName,
            value: [],
          });
        }, getTime(t));
        t += 2.5 * speedFactor;

        for (let k = 0; k < paramValue.length; k++) {
          const item = paramValue[k];
          setTimeout(() => {
            updateFunction({
              path: path + paramName + `.[${k}]`,
              value: item,
            });
          }, getTime(t));
          t += 5 * speedFactor;
        }
      } else if (paramSchema.type === RecipeParamType.String) {
        if (
          paramSchema.type === RecipeParamType.String &&
          typeof paramValue === "string"
        ) {
          // This is literally overkill but makes it look really cool!
          if (paramSchema.enum) {
            let speed = (paramSchema.enum.length > 5 ? 1 : 2) * speedFactor;
            for (const enumValue of paramSchema.enum) {
              setTimeout(() => {
                updateFunction({
                  path: path + paramName,
                  value: enumValue,
                });
              }, getTime(t));
              t += speed;
            }

            setTimeout(() => {
              updateFunction({
                path: path + paramName,
                value: paramValue,
              });
            }, getTime(t));
            t += speed;
          } else {
            for (let j = 0; j < paramValue.length; j++) {
              setTimeout(() => {
                updateFunction({
                  path: path + paramName,
                  value: paramValue.slice(0, j + 1),
                });
              }, getTime(t));
              t += 0.1 * speedFactor;
            }
          }
        }
      } else if (
        paramSchema.type === RecipeParamType.Number ||
        paramSchema.type === RecipeParamType.Integer
      ) {
        if (
          paramSchema.maximum != undefined &&
          paramSchema.minimum != undefined
        ) {
          setTimeout(() => {
            updateFunction({
              path: path + paramName,
              value: paramSchema.maximum,
            });
          }, getTime(t));
          t += 5 * speedFactor;

          setTimeout(() => {
            updateFunction({
              path: path + paramName,
              value: paramSchema.minimum,
            });
          }, getTime(t));
          t += 5 * speedFactor;
        }

        setTimeout(() => {
          updateFunction({
            path: path + paramName,
            value: paramValue,
          });
        }, getTime(t));
        t += 5 * speedFactor;
      } else if ("variants" in paramSchema) {
        const { isEnumButSingleType, paramTypes, enumVariantIndex } =
          getVariedParamInfo(paramSchema);

        const innerVariantSchema = paramSchema.variants[
          enumVariantIndex
        ] as RecipeStringParam;

        if (
          isEnumButSingleType &&
          paramTypes[0] === RecipeParamType.String &&
          typeof paramValue === "string" &&
          innerVariantSchema.enum
        ) {
          let speed =
            (innerVariantSchema.enum.length > 5 ? 1 : 2) * speedFactor;

          for (const enumValue of innerVariantSchema.enum) {
            setTimeout(() => {
              updateFunction({
                path: path + paramName,
                value: enumValue,
              });
            }, getTime(t));
            t += speed;
          }
        } else {
          setTimeout(() => {
            updateFunction({
              path: path + paramName,
              value: paramValue,
            });
          }, getTime(t));
          t += 0.2 * speedFactor;
        }
      } else {
        setTimeout(() => {
          updateFunction({
            path: path + paramName,
            value: paramValue,
          });
        }, getTime(t));
        t += 0.2 * speedFactor;
      }
    }

    clearOutput(session.id);
    setBodyRoute(RecipeBodyRoute.Parameters);
    setOutputTab(RecipeOutputTab.Docs);

    if (requestBody && "requestBody" in selectedRecipe) {
      setRequestBody({});
      const params = Object.keys(requestBody);

      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const paramValue = requestBody[paramName]!;
        const paramSchema = selectedRecipe.requestBody.objectSchema.find(
          (schema) => schema.name === paramName
        )!;

        updateMagic({
          paramName,
          paramValue,
          paramSchema,
          updateFunction: updateRequestBody,
          path: ".",
          speedFactor: 1,
        });
      }
    }

    if (queryParams && selectedRecipe.queryParams) {
      setQueryParams({});

      const params = Object.keys(queryParams);

      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const paramValue = queryParams[paramName]!;
        const paramSchema = selectedRecipe.queryParams.find(
          (schema) => schema.name === paramName
        )!;

        updateMagic({
          paramName,
          paramValue,
          paramSchema,
          updateFunction: updateQueryParams,
          path: ".",
          speedFactor: 3,
        });
      }
    }

    if (urlParams && selectedRecipe.urlParams) {
      setUrlParams({});

      const params = Object.keys(urlParams);

      for (let i = 0; i < params.length; i++) {
        const paramName = params[i];
        const paramValue = urlParams[paramName]!;
        const paramSchema = selectedRecipe.urlParams.find(
          (schema) => schema.name === paramName
        )!;

        updateMagic({
          paramName,
          paramValue,
          paramSchema,
          updateFunction: updateUrlParams,
          path: "",
          speedFactor: 3,
        });
      }
    }

    if (replay) {
      t += 5;
      setTimeout(() => {
        setIsSending(true, RecipeOutputTab.Output);
      }, getTime(t));
      t += 5;

      const { output, streaming, duration } = replay;
      const tEndValue = duration / 100;

      if (streaming) {
        const stringified = output.content as string;
        const speed = tEndValue / stringified.length;

        for (let i = 0; i < stringified.length; i++) {
          setTimeout(() => {
            setOutput(session.id, {
              output: {
                content: stringified.slice(0, i + 1),
              },
              type: RecipeOutputType.Streaming,
            });
          }, getTime(t));
          t += speed;
        }
      } else {
        t += tEndValue;
        setTimeout(() => {
          setOutput(session.id, {
            output,
            type: RecipeOutputType.Response,
            duration,
          });
        }, getTime(t));
      }

      setTimeout(() => {
        setIsSending(false, RecipeOutputTab.Output);
      }, getTime(t));
    }

    setTimeout(() => {
      setLoadingTemplate(null);

      if (!replay) {
        setIsSending(false, RecipeOutputTab.Docs);
      }
    }, getTime(t));
  }, [loadingTemplate]);
}

function getTime(t: number) {
  return t * 100;
}
