import classNames from "classnames";
import { RecipeAuthType } from "../../../types/recipes";
import { useEffect, useRef } from "react";
import {
  RecipeOutputType,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { useSecretManager } from "../../../state/recipeAuth";
import { RECIPE_PROXY } from "../../../utils/constants";

export function RecipeSearchButton() {
  const currentSession = useRecipeSessionStore((store) => store.currentSession);
  const requestBody = useRecipeSessionStore((store) => store.requestBody);
  const setOutput = useRecipeSessionStore((store) => store.setOutput);
  const clearOutput = useRecipeSessionStore((store) => store.clearOutput);
  const sm = useSecretManager();
  const fileManager = useRecipeSessionStore((store) => store.fileManager);

  const isSending = useRecipeSessionStore((store) => store.isSending);
  const setIsSending = useRecipeSessionStore((store) => store.setIsSending);
  const queryParams = useRecipeSessionStore((store) => store.queryParams);
  const urlParams = useRecipeSessionStore((store) => store.urlParams);

  const onSubmit = async () => {
    setIsSending(true);
    clearOutput();

    await _onSubmit();
    setTimeout(() => {
      setIsSending(false);
    }, 500);
  };
  const _onSubmit = async () => {
    if (!currentSession) return;

    const { recipe } = currentSession;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    let path = recipe.path;
    Object.entries(urlParams).forEach(([key, value]) => {
      if (!value) {
        alert(`Please provide a value for ${key}`);
        return;
      }
      path = path.replace(`{${key}}`, String(value));
    });

    let url = new URL(path);
    // TODO: Should we just make this the default so no one deals with this problem?
    if (recipe.cors) {
      headers["recipe-domain"] = url.origin;
      url = new URL(RECIPE_PROXY + url.pathname);
    }

    if (recipe.auth) {
      const token = sm.getSecret(recipe.project);
      if (!token) {
        alert("Please setup authentication first.");
        return;
      }

      if (recipe.auth === RecipeAuthType.Bearer) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      if (recipe.auth.includes("query")) {
        url.searchParams.append(recipe.auth.split("=")[1], token);
      }
    }
    let body: undefined | string | FormData;

    // TODO: We can have very strict validation eventually
    if (
      "requestBody" in currentSession.recipe &&
      "objectSchema" in currentSession.recipe.requestBody
    ) {
      const { objectSchema } = currentSession.recipe.requestBody;
      const requiredKeys = Object.keys(objectSchema).filter(
        (key) => objectSchema[key].required
      );

      // TODO: Move this to terminal
      if (requiredKeys.length > Object.keys(requestBody).length) {
        alert("Please fill in all required fields.");
        return;
      }

      const contentType = currentSession.recipe.requestBody.contentType;

      if (contentType === "application/json") {
        body = JSON.stringify(requestBody);
      } else if (contentType === "multipart/form-data") {
        // https://github.com/JakeChampion/fetch/issues/505#issuecomment-293064470
        delete headers["Content-Type"];

        const formData = new FormData();

        for (const key in requestBody) {
          let payload = requestBody[key];

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
      const payload = {
        method: recipe.method,
        headers,
        body,
      };

      const res = await fetch(url, payload);

      let output: Record<string, unknown> = {};

      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        output = await res.json();
      } else if (contentType?.includes("text/plain")) {
        output = { response: await res.text() };
      }

      setOutput({
        output: output,
        outputType: res.ok ? RecipeOutputType.Response : RecipeOutputType.Error,
      });
    } catch (e) {
      setOutput({
        output: {
          error:
            "Something went wrong. Can you report this issue to us at team@recipeui.com",
        },
        outputType: RecipeOutputType.Error,
      });
    }
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

  return (
    <div className="tooltip tooltip-bottom" data-tip="CMD+Enter">
      <button
        ref={ref}
        className={classNames(
          "btn dark:btn-accent dark:text-white sm:w-24 w-full",
          (!currentSession || isSending) && "btn-disabled"
        )}
        type="button"
        onClick={onSubmit}
      >
        {isSending ? (
          <span className="loading loading-infinity"></span>
        ) : (
          <span>Send</span>
        )}
      </button>
    </div>
  );
}
