import classNames from "classnames";
import { useContext, useEffect, useRef } from "react";
import { RECIPE_PROXY } from "@/utils/constants";
import { useSecretManager, useSecretsFromSM } from "@/state/recipeAuth";
import {
  RecipeContext,
  RecipeOutputTab,
  RecipeOutputType,
  useRecipeSessionStore,
} from "@/state/recipeSession";
import { RecipeAuthType } from "@/types/databaseExtended";
import { useHover } from "usehooks-ts";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "@/utils/posthogConstants";

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
    <div className="tooltip tooltip-bottom" data-tip="CMD+Enter">
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
