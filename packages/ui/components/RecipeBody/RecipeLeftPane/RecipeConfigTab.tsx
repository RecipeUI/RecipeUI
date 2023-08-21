import { useContext, useState } from "react";
import { getHeaderTypes, useSecretManager } from "../../../state/recipeAuth";
import classNames from "classnames";

import { RecipeAuthType } from "types/enums";
import {
  RecipeContext,
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { DOC_LINKS } from "../../../utils/docLinks";
import { Database } from "types/database";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";

export function RecipeConfigTab() {
  const selectedRecipe = useContext(RecipeContext)!;
  const needsAuth = selectedRecipe.auth !== null;
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useRecipeSessionStore((state) => state.user);
  const closeSession = useRecipeSessionStore((state) => state.closeSession);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const canDelete = selectedRecipe.author_id === user?.user_id;

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
          <hr />
          <div className="w-full space-y-4 text-start mt-4">
            <h1 className="text-xl font-bold">Delete Recipe</h1>
            <p>
              This will delete the API and all templates attached to this API.
            </p>
            {canDelete ? (
              <button
                className="btn btn-error btn-sm"
                onClick={async () => {
                  if (
                    !(await confirm(
                      "Are you sure you want to delete this API?"
                    ))
                  ) {
                    return;
                  }

                  const { error } = await supabase
                    .from("recipe")
                    .delete()
                    .match({ id: selectedRecipe.id });

                  if (currentSession) {
                    closeSession(currentSession);
                  }
                  setTimeout(() => {
                    router.push("/");
                  }, 0);
                }}
              >
                Delete
              </button>
            ) : (
              <p className="">
                Please ask the owner of this API to delete this
              </p>
            )}
          </div>
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
  const docLink =
    selectedRecipe.options?.docs?.auth || DOC_LINKS[selectedRecipe.project];

  const setOutputTab = useRecipeSessionStore((state) => state.setOutputTab);

  let authNote = <></>;

  if (selectedRecipe.auth === RecipeAuthType.Custom) {
    return <CustomAuthConfig onboardingFlow={onboardingFlow} />;
  }

  const generalDocLink = docLink ? (
    <>
      Read{" "}
      <a className="link tooltip" href={docLink} target="_blank">
        the guide
      </a>{" "}
      on getting auth for this project.
    </>
  ) : null;
  if (selectedRecipe.auth === RecipeAuthType.Bearer) {
    if (docLink) {
      authNote = (
        <p>
          This recipe authorizes with a Bearer token that you{" "}
          {existingSecret ? "can edit below" : "need to add below"}. Read{" "}
          <a className="link tooltip" href={docLink} target="_blank">
            the guide
          </a>{" "}
          on getting auth for this project.
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
  } else if (selectedRecipe.auth === RecipeAuthType.Query) {
    authNote = (
      <p>
        This recipe authorizes with a query param token that you can add below.{" "}
        {generalDocLink}
      </p>
    );
  } else if (selectedRecipe.auth === RecipeAuthType.ClientID) {
    authNote = (
      <p>
        This recipe authorizes with a Client ID token that you can add below.{" "}
        {generalDocLink}
      </p>
    );
  } else if (selectedRecipe.auth === RecipeAuthType.Token) {
    authNote = (
      <p>
        This recipe authorizes with a token that you can add below.{" "}
        {generalDocLink}
      </p>
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
                setOutputTab(RecipeOutputTab.Docs);
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

  const docLink =
    selectedRecipe.options?.docs?.auth || DOC_LINKS[selectedRecipe.project];

  const [showAuthFlow, setShowAuthFlow] = useState(!onboardingFlow);

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
          the guide
        </a>{" "}
        on getting setup with this project.
      </p>
      {showAuthFlow ? (
        <div>
          {simpleHeaders.map((h, i) => {
            return (
              <AuthInput header={h} onboardingFlow={onboardingFlow} key={i} />
            );
          })}
          <span
            className="text-sm mt-2 text-gray-600 tooltip"
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
  const setOutputTab = useRecipeSessionStore((state) => state.setOutputTab);

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
            setOutputTab(RecipeOutputTab.Docs);
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
