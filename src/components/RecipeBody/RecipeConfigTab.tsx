import { useState } from "react";
import { useSecretManager } from "../../state/recipeAuth";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { RecipeAuthType } from "../../types/recipes";
import classNames from "classnames";

import _docLinks from "../../assets/docLinks.json";
const docLinks = _docLinks as Record<string, string>;

export function RecipeConfigTab() {
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe
  );

  const needsAuth = selectedRecipe.auth !== null;

  return (
    <div className="flex-1 relative px-4 py-6">
      <div className="alert flex flex-col items-start w-full">
        <div className="w-full space-y-4">
          <h1 className="text-xl font-bold">Config</h1>
          {needsAuth && (
            <>
              <hr />
              <RecipeNeedsAuth />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecipeNeedsAuth({
  onboardingFlow = false,
}: {
  onboardingFlow?: boolean;
}) {
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe
  );
  const sm = useSecretManager();
  const [apiKey, setAPIKey] = useState<string>(
    sm.getSecret(selectedRecipe.project) || ""
  );

  const existingSecret = sm.getSecret(selectedRecipe.project);
  const hasChanged = apiKey !== sm.getSecret(selectedRecipe.project);
  const docLink = docLinks[selectedRecipe.project];

  let bearerNote = <></>;
  if (selectedRecipe.auth === RecipeAuthType.Bearer) {
    if (docLink) {
      bearerNote = (
        <p>
          This recipe authorizes with a Bearer token that you{" "}
          {existingSecret ? "can edit below" : "need to add below"}.{" "}
          <a className="link tooltip" href={docLink}>
            {selectedRecipe.project} docs
          </a>
          .
        </p>
      );
    } else {
      bearerNote = (
        <p>
          This recipe authorizes with a{" "}
          <span
            className="tooltip font-bold"
            data-tip={`This adds a request header with the key "Authorization" and the value "Bearer <your key>".`}
          >
            Bearer token
          </span>
          .{" "}
          {existingSecret
            ? "Edit your token below."
            : "Add your token below to get started."}
        </p>
      );
    }
  }

  const [showAuthFlow, setShowAuthFlow] = useState(!onboardingFlow);

  return (
    <>
      <div className="">
        <h3 className="font-bold mb-2">Setup</h3>
        {bearerNote}
        {showAuthFlow ? (
          <div className="space-x-2 mt-2">
            <input
              type="text"
              placeholder="api_key_here"
              className="input input-sm input-bordered max-w-xs"
              value={apiKey}
              onChange={(e) => setAPIKey(e.target.value)}
            />
            <button
              className={classNames(
                "btn btn-sm",
                hasChanged && apiKey ? "btn-neutral" : "btn-disabled"
              )}
              onClick={() => {
                sm.updateSecret(selectedRecipe.project, apiKey);
              }}
            >
              Submit
            </button>
            {!onboardingFlow && (
              <button
                className={classNames(
                  "btn btn-sm",
                  apiKey ? "btn-neutral" : "btn-disabled"
                )}
                onClick={() => {
                  sm.deleteSecret(selectedRecipe.project);
                  setAPIKey("");
                }}
              >
                Clear
              </button>
            )}
            <span
              className="text-sm mt-1 text-gray-600 tooltip"
              data-tip="We store no data online. Tokens are only stored locally."
            >
              How are tokens stored?
            </span>
          </div>
        ) : (
          <div className="mt-2">
            <button
              className="btn btn-sm btn-neutral"
              onClick={() => {
                setShowAuthFlow(true);
              }}
            >
              Configure
            </button>
          </div>
        )}
      </div>
    </>
  );
}
