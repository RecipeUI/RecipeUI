import { useCallback, useEffect, useMemo, useState } from "react";
import { useSecretFromSM } from "../../state/recipeAuth";
import {
  RecipeBodyRoute,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import CodeMirror from "@uiw/react-codemirror";
import debounce from "lodash.debounce";

import { json, jsonParseLinter } from "@codemirror/lang-json";
import { useDarkMode, useDebounce } from "usehooks-ts";
import { linter, lintGutter } from "@codemirror/lint";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { RecipeNeedsAuth } from "./RecipeConfigTab";
import { getDefaultValue } from "../../utils/main";
import classNames from "classnames";

const extensions = [json(), linter(jsonParseLinter()), lintGutter()];
const codeMirrorSetup = {
  lineNumbers: true,
};

// TODO: Link to our guides for setting up auth
export function RecipeParameterTab() {
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const currentSession = useRecipeSessionStore(
    (state) => state.currentSession!
  );

  const selectedRecipe = currentSession.recipe;
  const secret = useSecretFromSM(selectedRecipe.project);

  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);

  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);

  const {
    needsAuthSetup,
    hasRequiredBodyParams,
    hasRequestBody,
    hasQueryParams,
    hasRequiredQueryParams,
    hasUrlParams,
  } = useMemo(() => {
    const needsAuthSetup = selectedRecipe.auth != null && secret == null;

    let hasRequiredBodyParams = false;
    let hasRequestBody = false;
    if (
      "requestBody" in selectedRecipe &&
      selectedRecipe.requestBody != null &&
      "objectSchema" in selectedRecipe["requestBody"] &&
      selectedRecipe.requestBody.objectSchema != null
    ) {
      hasRequiredBodyParams = Object.values(
        selectedRecipe.requestBody.objectSchema
      ).some((param) => param.required);
      hasRequestBody = true;
    }

    let hasQueryParams = false;
    let hasRequiredQueryParams = false;
    if ("queryParams" in selectedRecipe && selectedRecipe.queryParams != null) {
      hasRequiredQueryParams = Object.values(selectedRecipe.queryParams).some(
        (param) => param.required
      );
      hasQueryParams = true;
    }

    const hasUrlParams =
      "urlParams" in selectedRecipe && selectedRecipe.urlParams != null;

    return {
      needsAuthSetup,
      hasRequiredBodyParams,
      hasRequestBody,
      hasQueryParams,
      hasRequiredQueryParams,
      hasUrlParams,
    };
  }, [secret, selectedRecipe]);
  const hasRequestBodyPayload = Object.keys(requestBody).length > 0;
  const needsBodyParams = hasRequiredBodyParams && !hasRequestBodyPayload;

  const hasQueryParamPayload = Object.keys(queryParams).length > 0;
  const needsQueryParams = hasRequiredQueryParams && !hasQueryParamPayload;

  const showOnboarding = needsAuthSetup || needsBodyParams || needsQueryParams;

  const hasExamples = selectedRecipe.examples != null;

  return (
    <div className="flex-1">
      {showOnboarding && (
        <div className="space-y-4 mb-4 mx-4 mt-6">
          <div className="alert w-full flex">
            <div className="space-y-4 w-full text-start">
              <h1 className="font-bold text-2xl">Get Started</h1>
              {needsAuthSetup && (
                <>
                  <hr />
                  <RecipeNeedsAuth onboardingFlow />
                </>
              )}
              {!needsAuthSetup && (needsBodyParams || needsQueryParams) && (
                <>
                  <hr />
                  <div className="space-y-2">
                    <h3 className="font-bold">Parameters</h3>
                    <p>
                      Use the docs panel to the right
                      {!needsBodyParams
                        ? " to start adding params"
                        : " or hit below to open the editor"}
                      .
                    </p>
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={() => {
                        if (
                          needsBodyParams &&
                          "requestBody" in selectedRecipe &&
                          "objectSchema" in selectedRecipe["requestBody"]
                        ) {
                          setRequestBody(
                            getDefaultValue(
                              selectedRecipe.requestBody,
                              true
                            ) as Record<string, unknown>
                          );
                        }

                        if (
                          needsQueryParams &&
                          "queryParams" in selectedRecipe &&
                          selectedRecipe.queryParams != null
                        ) {
                          const record: Record<string, unknown> = {};
                          Object.entries(selectedRecipe.queryParams).forEach(
                            ([key, value]) => {
                              const defaultVal = getDefaultValue(value, true);
                              if (defaultVal !== undefined) {
                                record[key] = defaultVal;
                              }
                            }
                          );
                          setQueryParams(record);
                        }

                        // TODO: Got to make this work for query params
                      }}
                    >
                      {needsBodyParams ? "Open editor" : "Initialize params"}
                    </button>
                  </div>

                  {hasExamples && (
                    <>
                      <hr />
                      <div className="space-y-2">
                        <h3 className="font-bold">Examples</h3>
                        <p>Find some quick use cases or templates.</p>
                        <button
                          className="btn btn-sm btn-neutral"
                          onClick={() => {
                            setBodyRoute(RecipeBodyRoute.Templates);
                          }}
                        >
                          View examples
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {(!showOnboarding || hasRequestBodyPayload) && hasRequestBody && (
        <RecipeJsonEditor />
      )}
      {(!showOnboarding || hasQueryParamPayload) && hasQueryParams && (
        <RecipeQueryParameters />
      )}
      {!showOnboarding && hasUrlParams && <RecipeURLParams />}

      {!showOnboarding &&
        !hasRequestBody &&
        !hasQueryParams &&
        !hasUrlParams && <NoEditorCopy />}
    </div>
  );
}

function NoEditorCopy() {
  return (
    <div className="mx-4 my-6">
      <div className="alert alert-success">
        <span>
          This API has no parameters. Hit send at the top right to use it!
        </span>
      </div>
    </div>
  );
}

function RecipeJsonEditor() {
  const _requestBody = useRecipeSessionStore((state) => state.requestBody);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe!
  );

  const [requestCode, setRequestCode] = useState("");
  const requestBody = useDebounce(_requestBody, 300);

  // Note(jeane): I find these lines of code pretty bad, but I can't think of an alternative.
  // We have two different sources for updating the request body. This code editor and the
  // docs pane. Both suffer from input that can be typed very quickly and will need
  // a lot of back and forth between JSON.stringify and JSON.parse.
  //
  // Choosing to make this editor where it's okay if the code is lagging.
  useEffect(() => {
    const validCode = JSON.stringify(requestBody, null, 2);
    setRequestCode(validCode);
  }, [requestBody]);

  const debouncedSetRequestBody = useCallback(
    debounce((debouncedCode: string) => {
      try {
        const validJson = JSON.parse(debouncedCode || "{}");
        setRequestBody(validJson);
      } catch (e) {
        //
      }
    }, 1000),
    [setRequestBody]
  );
  const { isDarkMode } = useDarkMode();

  return (
    <div className="mx-4 my-6">
      <div className="flex items-center space-x-1 mb-2">
        <h3 className="text-lg font-bold">Request Body</h3>
        <div
          className="tooltip tooltip-right"
          data-tip={`This is the payload we'll send to ${selectedRecipe.project}. Use parameters on the right or choose from examples.`}
        >
          <InformationCircleIcon className="h-4 w-4" />
        </div>
      </div>
      <CodeMirror
        className="h-full !outline-none border-none"
        value={requestCode}
        basicSetup={codeMirrorSetup}
        theme={isDarkMode ? "dark" : "light"}
        extensions={extensions}
        onChange={(newCode) => {
          setRequestCode(newCode);
          debouncedSetRequestBody(newCode);
        }}
      />
    </div>
  );
}

function RecipeQueryParameters() {
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const hasNoParams = Object.keys(queryParams).length === 0;
  const recipe = useRecipeSessionStore((state) => state.currentSession!.recipe);

  return (
    <div className="mx-4 my-6">
      <div className="flex items-center space-x-1 mb-2">
        <h3 className="text-lg font-bold">Query Parameters</h3>
        <div
          className="tooltip tooltip-right"
          data-tip={`These are appended to the end of the url. Use parameters on the right or choose from examples.`}
        >
          <InformationCircleIcon className="h-4 w-4" />
        </div>
      </div>
      <pre className="whitespace-pre-wrap">
        {Object.entries(queryParams).map(([key, value]) => {
          const recipeSchema = recipe.queryParams!.find(
            (param) => param.name === key
          );

          const isRequired = recipeSchema?.required ?? false;

          return (
            <div key={key}>
              <span className="">{key}:</span>{" "}
              {isRequired && (value == undefined || value == "") ? (
                <span className="text-error">
                  This param is required, fill it out in the docs pane.
                </span>
              ) : (
                <span className="">
                  {typeof value !== "object"
                    ? (value as unknown as string | number | boolean)
                    : JSON.stringify(value)}
                </span>
              )}
            </div>
          );
        })}
      </pre>
      {hasNoParams ? (
        <div className="alert">
          {
            "This endpoint doesn't need params but you can easily configure params in the doc pane."
          }
        </div>
      ) : null}
    </div>
  );
}

function RecipeURLParams() {
  const urlParams = useRecipeSessionStore((state) => state.urlParams);
  const recipe = useRecipeSessionStore((state) => state.currentSession!.recipe);

  // This should never happen, just narrowing type
  if (!("urlParams" in recipe && recipe.urlParams !== undefined)) {
    return null;
  }

  return (
    <div className="mx-4 my-6">
      <div className="flex items-center space-x-1 mb-2">
        <h3 className="text-lg font-bold">Url Parameters</h3>
        <div
          className="tooltip tooltip-right"
          data-tip={`These are variables we replace in the url. Use parameters on the right or choose from examples.`}
        >
          <InformationCircleIcon className="h-4 w-4" />
        </div>
      </div>
      <pre className="whitespace-pre-wrap">
        {recipe.urlParams.map((paramSchema) => {
          const key = paramSchema.name;
          const value = urlParams[key] as string | undefined;
          const isRequired = paramSchema.required ?? true;

          return (
            <div
              key={key}
              className={classNames(!value && isRequired && "text-error")}
            >
              <span>{key}:</span>{" "}
              <span>
                {value ||
                  (isRequired
                    ? "Setup this parameter in the docs pane"
                    : "Optional")}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
