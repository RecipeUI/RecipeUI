import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSecretFromSM } from "../../state/recipeAuth";
import {
  RecipeBodyRoute,
  RecipeContext,
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
import { UserTemplates } from "@/components/RecipeBody/RecipeTemplates";

const extensions = [json(), linter(jsonParseLinter()), lintGutter()];
const codeMirrorSetup = {
  lineNumbers: true,
};

// TODO: Link to our guides for setting up auth
export function RecipeParameterTab() {
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const selectedRecipe = useContext(RecipeContext)!;
  const secret = useSecretFromSM(selectedRecipe.project);

  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const urlParams = useRecipeSessionStore((state) => state.urlParams);

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

  const hasUrlParamPayload = Object.keys(urlParams).length > 0;
  const needsUrlParams = hasUrlParams && !hasUrlParamPayload;

  const showOnboarding = needsAuthSetup || needsBodyParams || needsQueryParams;

  const hasTemplates = selectedRecipe.templates != null;

  return (
    <div className="flex-1">
      {showOnboarding && (
        <div className="space-y-4 mb-4 mx-4 mt-6">
          <div className="alert w-full flex bg-gray-400 dark:bg-base-200">
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
                  {hasTemplates && (
                    <>
                      <hr />
                      <div className="space-y-2">
                        <h3 className="font-bold">Recipes</h3>
                        <p>Find some quick use cases or examples.</p>
                        <button
                          className="btn btn-sm btn-neutral"
                          onClick={() => {
                            setBodyRoute(RecipeBodyRoute.Templates);
                          }}
                        >
                          View recipes
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

      <div className="mb-4 mx-4 mt-6">
        {!needsAuthSetup &&
          (needsBodyParams || needsQueryParams || needsUrlParams) && (
            <UserTemplates />
          )}
      </div>

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
  const selectedRecipe = useContext(RecipeContext)!;

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
  const recipe = useContext(RecipeContext)!;
  const hasNoParams = Object.values(recipe.queryParams!).every(
    (param) => param.required === undefined || param.required === false
  );

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
                    ? (String(value) as unknown as string | number | boolean)
                    : JSON.stringify(value)}
                </span>
              )}
            </div>
          );
        })}
      </pre>
      {hasNoParams && Object.keys(queryParams).length === 0 ? (
        <div className="alert alert-success">
          {
            "You can run this endpoint now if you want! Play around with the docs pane to get different results after."
          }
        </div>
      ) : null}
    </div>
  );
}

function RecipeURLParams() {
  const urlParams = useRecipeSessionStore((state) => state.urlParams);
  const recipe = useContext(RecipeContext)!;

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
