import { useContext, useState } from "react";
import { useSecretManager } from "../../state/recipeAuth";
import classNames from "classnames";

import _docLinks from "../../assets/docLinks.json";
import { RecipeAuthType } from "@/types/databaseExtended";
import { RecipeContext, useRecipeSessionStore } from "@/state/recipeSession";
const docLinks = _docLinks as Record<string, string>;

export function RecipeConfigTab() {
  const selectedRecipe = useContext(RecipeContext)!;

  const needsAuth = selectedRecipe.auth !== null;

  return (
    <div className="flex-1 relative px-4 py-6">
      <div className="alert flex flex-col items-start w-full bg-gray-400 dark:bg-base-200">
        <div className="w-full space-y-4 text-start">
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
  const selectedRecipe = useContext(RecipeContext)!;
  const sm = useSecretManager();
  const [apiKey, setAPIKey] = useState<string>(
    sm.getSecret(selectedRecipe.project) || ""
  );

  const [showAuthFlow, setShowAuthFlow] = useState(!onboardingFlow);

  const existingSecret = sm.getSecret(selectedRecipe.project);
  const hasChanged = apiKey !== sm.getSecret(selectedRecipe.project);
  const docLink = docLinks[selectedRecipe.project];

  let authNote = <></>;
  if (selectedRecipe.auth === RecipeAuthType.Bearer) {
    if (docLink) {
      authNote = (
        <p>
          This recipe authorizes with a Bearer token that you{" "}
          {existingSecret ? "can edit below" : "need to add below"}.{" "}
          <a className="link tooltip" href={docLink} target="_blank">
            {selectedRecipe.project} docs
          </a>
          .
        </p>
      );
    } else {
      authNote = (
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
  } else if (selectedRecipe.auth && selectedRecipe.auth.includes("query")) {
    authNote = (
      <p>
        This recipe authorizes with a query param token that you can add below.
      </p>
    );
  } else if (selectedRecipe.auth === RecipeAuthType.ClientID) {
    authNote = (
      <p>
        This recipe authorizes with a Client ID token that you can add below.
      </p>
    );
  } else if (selectedRecipe.auth === RecipeAuthType.Token) {
    authNote = (
      <p>This recipe authorizes with a token that you can add below.</p>
    );
  }

  return (
    <>
      <div className="text-start">
        <h3 className="font-bold mb-2">Setup</h3>
        {authNote}
        {showAuthFlow ? (
          <div className="sm:space-x-2 mt-2 flex gap-2 flex-col sm:block">
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
              data-tip="We store no tokens online. Tokens are only stored locally."
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
