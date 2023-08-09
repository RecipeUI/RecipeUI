import { useContext, useState } from "react";
import { getHeaderTypes, useSecretManager } from "../../state/recipeAuth";
import classNames from "classnames";

import { RecipeAuthType } from "@/types/databaseExtended";
import { RecipeContext } from "@/state/recipeSession";
import { DOC_LINKS } from "@/utils/docLinks";

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

  const authConfig = {
    project: selectedRecipe.project,
    auth: selectedRecipe.auth!,
  };
  const [apiKey, setAPIKey] = useState<string>(sm.getSecret(authConfig) || "");

  const [showAuthFlow, setShowAuthFlow] = useState(!onboardingFlow);

  const existingSecret = sm.getSecret(authConfig);
  const hasChanged = apiKey !== sm.getSecret(authConfig);
  const docLink = DOC_LINKS[selectedRecipe.project];

  let authNote = <></>;

  if (selectedRecipe.auth === RecipeAuthType.Custom) {
    return <CustomAuthConfig onboardingFlow={onboardingFlow} />;
  }
  if (selectedRecipe.auth === RecipeAuthType.Bearer) {
    if (docLink) {
      authNote = (
        <p>
          This recipe authorizes with a Bearer token that you{" "}
          {existingSecret ? "can edit below" : "need to add below"}. Read{" "}
          <a className="link tooltip" href={docLink} target="_blank">
            our guide
          </a>{" "}
          on getting auth for {selectedRecipe.project}.
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
                sm.updateSecret(authConfig, apiKey);
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
                  sm.deleteSecret(authConfig);
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

function CustomAuthConfig({ onboardingFlow }: { onboardingFlow: boolean }) {
  const selectedRecipe = useContext(RecipeContext)!;
  const { simpleHeaders } = getHeaderTypes(selectedRecipe.options?.auth || []);

  const docLink = DOC_LINKS[selectedRecipe.project];

  return (
    <div className="text-start">
      <h3 className="font-bold mb-2">Setup</h3>
      <p>
        This API has a custom authentication setup. Read{" "}
        <a
          href={docLink}
          target="_blank"
          className="underline underline-offset-2"
        >
          our guide
        </a>{" "}
        on getting setup with {selectedRecipe.project}.
      </p>
      {simpleHeaders.map((h, i) => {
        return <AuthInput header={h} onboardingFlow={onboardingFlow} key={i} />;
      })}
      <span
        className="text-sm mt-2 text-gray-600 tooltip"
        data-tip="We store no tokens online. Tokens are only stored locally."
      >
        How are tokens stored?
      </span>
    </div>
  );
}

function AuthInput({
  header,
  onboardingFlow,
}: {
  header: string;
  onboardingFlow: boolean;
}) {
  const selectedRecipe = useContext(RecipeContext)!;
  const sm = useSecretManager();
  const authConfig = {
    project: selectedRecipe.project,
    auth: header,
  };
  const [apiKey, setAPIKey] = useState<string>(sm.getSecret(authConfig) || "");

  const existingSecret = sm.getSecret(authConfig);
  const hasChanged = apiKey !== sm.getSecret(authConfig);

  return (
    <div className="mt-4">
      <label className="text-sm">{header}</label>
      <div className="sm:space-x-2 mt-2 flex gap-2 flex-col sm:block">
        <input
          type="text"
          placeholder={`${header}`}
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
            sm.updateSecret(authConfig, apiKey);
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
              sm.deleteSecret(authConfig);
              setAPIKey("");
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
