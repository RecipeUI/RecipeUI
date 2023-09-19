import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import CodeMirror from "@uiw/react-codemirror";
import debounce from "lodash.debounce";

import { json, jsonParseLinter } from "@codemirror/lang-json";
import { lintGutter, linter } from "@codemirror/lint";
import { useDarkMode, useDebounce } from "usehooks-ts";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { StarterTemplates } from "./RecipeTemplates";
import { useLeftPaneInfo } from "./useLeftPaneInfo";
import { JSONSchema6 } from "json-schema";

const extensions = [json(), linter(jsonParseLinter()), lintGutter()];
const codeMirrorSetup = {
  lineNumbers: true,
  highlightActiveLine: false,
};

export function RecipeParameterTab() {
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const {
    loadingTemplate,
    showOnboarding,
    needsAuthSetup,
    hasTemplates,
    needsParams,
    showingRecipes,
    showingRecipesTwo,
    hasNoParams,
    hasRequestBody,
    hasUrlParams,
    hasQueryParams,
  } = useLeftPaneInfo();

  return (
    <div className="flex-1 overflow-x-auto sm:block hidden">
      {/* This logic is pretty confusing */}
      {(showingRecipesTwo || true) && (
        <div className="mb-4 mx-4 mt-6 space-y-8">
          {/* <UserTemplates /> */}
          <StarterTemplates />
        </div>
      )}
      {false ? (
        needsAuthSetup ? (
          <div className="space-y-4 mb-4 mx-4 mt-6">
            <div className="alert w-full flex bg-gray-300 dark:bg-base-200">
              <div className="space-y-4 w-full text-start">
                <h1 className="font-bold text-2xl">Get Started</h1>
                {hasTemplates && needsAuthSetup && (
                  <>
                    <hr />
                    <h3 className="font-bold mb-2">Recipe Playground</h3>
                    <p>
                      Mock with recipes below or setup auth to experience the
                      endpoint fully.
                    </p>
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={() => {
                        setBodyRoute(RecipeBodyRoute.Templates);
                      }}
                    >
                      Mock with recipes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : !hasTemplates ? (
          <div className="mb-4 mx-4 mt-6">
            <div className="alert alert-info">
              Get started by using the docs pane on the right!
            </div>
          </div>
        ) : null
      ) : null}

      {!showingRecipesTwo && <div className="divider" />}
      {!showingRecipes && hasRequestBody && !loadingTemplate && (
        <RecipeJsonEditor />
      )}
      {!showingRecipes && hasQueryParams && !loadingTemplate && (
        <RecipeQueryParameters
          needsParams={needsParams}
          needsAuthSetup={needsAuthSetup}
        />
      )}
      {!showingRecipes && hasUrlParams && !loadingTemplate && (
        <RecipeURLParams />
      )}

      {hasNoParams && <NoEditorCopy />}
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
        const validJson = debouncedCode ? JSON.parse(debouncedCode) : null;
        setRequestBody(validJson);
      } catch (e) {
        //
      }
    }, 1000),
    [setRequestBody]
  );
  const { isDarkMode } = useDarkMode();

  return (
    <div className="mx-4 my-6 overflow-x-auto min-h-[250px]">
      <div className="flex items-center space-x-1 mb-2">
        <h3 className="text-lg font-bold">Request Body</h3>
        <div
          className="tooltip tooltip-bottom"
          data-tip={`This is the payload we'll send. Use parameters on the right or choose from examples.`}
        >
          <InformationCircleIcon className="h-4 w-4" />
        </div>
      </div>
      <CodeMirror
        className="h-full !outline-none border-none whitespace-nowrap  max-w-sm sm:max-w-none"
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

// function DEPRECATED_RecipeQueryParameters({
//   needsParams,
//   needsAuthSetup,
// }: {
//   needsParams: boolean;
//   needsAuthSetup: boolean;
// }) {
//   const queryParams = useRecipeSessionStore((state) => state.queryParams);
//   const recipe = useContext(RecipeContext)!;
//   const hasNoParams = Object.values(recipe.queryParams!).every(
//     (param) => param.required === undefined || param.required === false
//   );

//   if (hasNoParams && needsAuthSetup) {
//     return null;
//   }

//   return (
//     <div className="mx-4 my-6">
//       <div className="flex items-center space-x-1 mb-2">
//         <h3 className="text-lg font-bold">Query Parameters</h3>
//         <div
//           className="tooltip tooltip-right"
//           data-tip={`These are appended to the end of the url. Use parameters on the right or choose from examples.`}
//         >
//           <InformationCircleIcon className="h-4 w-4" />
//         </div>
//       </div>
//       <pre className="whitespace-pre-wrap">
//         {Object.entries(queryParams).map(([key, value]) => {
//           const recipeSchema = recipe.queryParams!.find(
//             (param) => param.name === key
//           );

//           const isRequired = recipeSchema?.required ?? false;

//           return (
//             <div key={key}>
//               <span className="">{key}:</span>{" "}
//               {isRequired && (value == undefined || value == "") ? (
//                 <span className="text-error">
//                   This param is required, fill it out in the docs pane.
//                 </span>
//               ) : (
//                 <span className="">
//                   {typeof value !== "object"
//                     ? (String(value) as unknown as string | number | boolean)
//                     : JSON.stringify(value)}
//                 </span>
//               )}
//             </div>
//           );
//         })}
//       </pre>
//       {hasNoParams && !needsParams && Object.keys(queryParams).length === 0 ? (
//         <div className="alert alert-success">
//           {
//             "You can run this endpoint now if you want! Play around with the docs pane to get different results after."
//           }
//         </div>
//       ) : null}
//     </div>
//   );
// }

function RecipeQueryParameters({
  needsParams,
  needsAuthSetup,
}: {
  needsParams: boolean;
  needsAuthSetup: boolean;
}) {
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const recipe = useContext(RecipeContext)!;
  const hasNoParams = recipe.queryParams
    ? (!recipe.queryParams.properties ||
        Object.keys(recipe.queryParams?.properties).length === 0) &&
      recipe.queryParams?.additionalProperties !== true
    : false;

  if (hasNoParams && needsAuthSetup) {
    return null;
  }

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
          const recipeQueryParamSchema = recipe.queryParams as JSONSchema6;

          const isRequired =
            recipeQueryParamSchema.required?.includes(key) ?? false;

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
      {hasNoParams && !needsParams && Object.keys(queryParams).length === 0 ? (
        <div className="alert alert-success">
          {
            "You can run this endpoint now if you want! Play around with the docs pane to get different results after."
          }
        </div>
      ) : null}
    </div>
  );
}

// function DEPRECATED_RecipeURLParams() {
//   const urlParams = useRecipeSessionStore((state) => state.urlParams);
//   const recipe = useContext(RecipeContext)!;

//   if (!recipe.urlParams) {
//     return null;
//   }

//   return (
//     <div className="mx-4 my-6">
//       <div className="flex items-center space-x-1 mb-2">
//         <h3 className="text-lg font-bold">Url Parameters</h3>
//         <div
//           className="tooltip tooltip-right"
//           data-tip={`These are variables we replace in the url. Use parameters on the right or choose from examples.`}
//         >
//           <InformationCircleIcon className="h-4 w-4" />
//         </div>
//       </div>
//       <pre className="whitespace-pre-wrap">
//         {recipe.urlParams.map((paramSchema) => {
//           const key = paramSchema.name;
//           const value = urlParams[key] as string | undefined;
//           const isRequired = paramSchema.required ?? true;

//           return (
//             <div
//               key={key}
//               className={classNames(!value && isRequired && "text-error")}
//             >
//               <span>{key}:</span>{" "}
//               <span>
//                 {value ||
//                   (isRequired
//                     ? "Setup this parameter in the docs pane"
//                     : "Optional")}
//               </span>
//             </div>
//           );
//         })}
//       </pre>
//     </div>
//   );
// }

function RecipeURLParams() {
  const urlParams = useRecipeSessionStore((state) => state.urlParams);
  const recipe = useContext(RecipeContext)!;

  const recipeURLParams = recipe.urlParams as JSONSchema6 | null;

  if (!recipeURLParams?.properties) {
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
        {Object.keys(recipeURLParams.properties).map((paramName) => {
          const key = paramName;
          const value = urlParams[key] as string | undefined;

          const isRequired = recipeURLParams.required?.includes(key) ?? true;

          return (
            <div
              key={key}
              className={classNames(
                value === undefined && isRequired && "text-error"
              )}
            >
              <span>{key}:</span>{" "}
              <span>
                {value !== undefined
                  ? value
                  : isRequired
                  ? "Setup this parameter in the docs pane"
                  : "Optional"}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
