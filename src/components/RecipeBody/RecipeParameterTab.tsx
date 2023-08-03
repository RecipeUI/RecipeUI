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
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const secret = useSecretFromSM(selectedRecipe.project);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);

  const { needsAuthSetup, hasRequiredParams, hasRequestBody } = useMemo(() => {
    const needsAuthSetup = selectedRecipe.auth !== null && secret == null;

    let hasRequiredParams = false;
    let hasRequestBody = false;
    if (
      "requestBody" in selectedRecipe &&
      "objectSchema" in selectedRecipe["requestBody"]
    ) {
      hasRequiredParams = Object.values(
        selectedRecipe.requestBody.objectSchema
      ).some((param) => param.required);
      hasRequestBody = true;
    }

    return {
      needsAuthSetup,
      hasRequiredParams,
      hasRequestBody,
    };
  }, [secret, selectedRecipe]);
  const needsParams =
    hasRequiredParams && Object.keys(requestBody).length === 0;

  const showOnboarding = needsAuthSetup || needsParams;
  const hasExamples = "examples" in selectedRecipe;
  const hasRequestBodyPayload = Object.keys(requestBody).length > 0;

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
              {needsParams && (
                <>
                  <hr />
                  <div className="space-y-2">
                    <h3 className="font-bold">Parameters</h3>
                    <p>
                      Use the docs panel to the right or hit below to open the
                      editor.
                    </p>
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={() => {
                        if (
                          needsParams &&
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
                      }}
                    >
                      Open editor
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
                            setBodyRoute(RecipeBodyRoute.Examples);
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
      {!showOnboarding && !hasRequestBody && <NoEditorCopy />}
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
          data-tip={`This the payload we'll send to ${selectedRecipe.project}. Use parameters on the right or choose from examples.`}
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
