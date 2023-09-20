"use client";

import { useEffect, useState } from "react";
import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { RecipeAuthType } from "types/enums";
import classNames from "classnames";
import { SecretAPI } from "../../state/apiSession/SecretAPI";
import { SingleAuthConfig, TraditionalSingleAuth } from "types/database";

export function EditorAuth() {
  const editorAuthConfig = useRecipeSessionStore(
    (state) => state.editorAuthConfig
  );
  const setEditorAuthConfig = useRecipeSessionStore(
    (state) => state.setEditorAuthConfig
  );

  const singleConfig =
    editorAuthConfig && editorAuthConfig.type !== RecipeAuthType.Multiple
      ? editorAuthConfig
      : null;

  return (
    <div className="flex-1 ">
      {singleConfig && <SingleAuthConfig editorAuthConfig={singleConfig} />}
      <div className="grid grid-cols-2 gap-4 px-4 py-4 border-t border-recipe-slate">
        <AuthButton
          label="None"
          description="This API request no authentication."
          onClick={() => {
            setEditorAuthConfig(null);
          }}
          selected={editorAuthConfig === null}
        />
        <AuthButton
          label="Bearer"
          description='Very common for APIs. Uses Bearer prefix in "Authorization" header.'
          selected={singleConfig?.type === RecipeAuthType.Bearer}
          onClick={() => {
            setEditorAuthConfig({
              type: RecipeAuthType.Bearer,
            });
          }}
        />
        <AuthButton
          label="Query"
          description="An API key in a query parameter."
          selected={singleConfig?.type === RecipeAuthType.Query}
          onClick={() => {
            setEditorAuthConfig({
              type: RecipeAuthType.Query,
              payload: {
                name: "api_key",
              },
            });
          }}
        />
        <AuthButton
          label="Header"
          description="An API key in a header."
          selected={singleConfig?.type === RecipeAuthType.Header}
          onClick={() => {
            setEditorAuthConfig({
              type: RecipeAuthType.Header,
              payload: {
                name: "Authorization",
              },
            });
          }}
        />
        <AuthButton
          label="OAuth (Soon)"
          description="Join our Discord or email us to use this feature now."
          // selected={singleConfig?.type === RecipeAuthType.OAuth}
          className="opacity-50 pointer-events-none"
          onClick={() => {}}
        />
      </div>
    </div>
  );
}

function SingleAuthConfig({
  editorAuthConfig,
}: {
  editorAuthConfig: SingleAuthConfig;
}) {
  if (
    editorAuthConfig.type === RecipeAuthType.Bearer ||
    editorAuthConfig.type === RecipeAuthType.Query ||
    editorAuthConfig.type === RecipeAuthType.Header
  ) {
    return <TraditionalSingleAuthConfig editorAuthConfig={editorAuthConfig} />;
  }

  return null;
}

function TraditionalSingleAuthConfig({
  editorAuthConfig,
}: {
  editorAuthConfig: TraditionalSingleAuth;
}) {
  const currentSession = useRecipeSessionStore(
    (state) => state.currentSession
  )!;

  const setEditorAuthConfig = useRecipeSessionStore(
    (state) => state.setEditorAuthConfig
  );

  const [authConfig, setAuthConfig] = useState<TraditionalSingleAuth | null>(
    null
  );
  useEffect(() => {
    setAuthConfig(editorAuthConfig);
  }, [editorAuthConfig]);

  const [hasChanged, setHasChanged] = useState(false);

  const [secret, setSecret] = useState("");
  useEffect(() => {
    SecretAPI.getSecret({ secretId: currentSession.recipeId }).then(
      (secret) => {
        setSecret(secret || "");
      }
    );
  }, [currentSession?.recipeId]);

  return (
    <div className={classNames("py-2 p-4 pb-4")}>
      {editorAuthConfig.type !== RecipeAuthType.Bearer && (
        <AuthFormWrapper label={`${editorAuthConfig.type} Param Name`}>
          <input
            type="text"
            autoCorrect="off"
            className={classNames(
              "input input-bordered w-full input-sm",
              !authConfig?.payload?.name && "input-error"
            )}
            placeholder={
              editorAuthConfig.type === RecipeAuthType.Header
                ? "e.g Authorization"
                : "e.g api_key"
            }
            value={authConfig?.payload?.name}
            onChange={(e) => {
              if (!hasChanged) setHasChanged(true);

              setAuthConfig({
                type: editorAuthConfig.type,
                payload: {
                  ...authConfig?.payload,
                  name: e.target.value,
                },
              });
            }}
          />
        </AuthFormWrapper>
      )}

      <AuthFormWrapper
        label={`${editorAuthConfig.type} Secret Value`}
        description={
          editorAuthConfig.type === RecipeAuthType.Bearer
            ? "Bearer token. Do not include the word 'Bearer'."
            : undefined
        }
      >
        <input
          type="text"
          autoComplete="off"
          autoCapitalize="off"
          className={classNames(
            "input input-bordered w-full input-sm",
            !secret && "input-error"
          )}
          value={secret}
          onChange={(e) => {
            if (!hasChanged) setHasChanged(true);

            setSecret(e.target.value);
          }}
        />
      </AuthFormWrapper>
      <div className="space-x-2">
        <button
          className={classNames(
            "btn btn-sm btn-accent mt-2",
            !hasChanged && "btn-disabled"
          )}
          onClick={async () => {
            await SecretAPI.saveSecret({
              secretId: currentSession!.recipeId,
              secretValue: secret,
            });

            setEditorAuthConfig(authConfig);
            setHasChanged(false);
          }}
        >
          Save changes
        </button>
        <button
          className={classNames(
            "btn btn-sm btn-neutral mt-2",
            !secret && "btn-disabled"
          )}
          onClick={() => {
            setHasChanged(false);
            SecretAPI.deleteSecret({
              secretId: currentSession!.recipeId,
            });
            setSecret("");

            alert("Deleted secret");
          }}
        >
          Delete secret
        </button>
      </div>
    </div>
  );
}

function AuthButton({
  onClick,
  label,
  description,
  selected,
  className,
}: {
  onClick: () => void;
  label: string;
  description: string;
  selected?: boolean;
  className?: string;
}) {
  return (
    <button
      className={classNames(
        "border border-recipe-slate shadow-md rounded-md p-4 text-start space-y-2 h-[130px] flex flex-col justify-start",
        selected && "bg-slate-600  text-white",
        className
      )}
      onClick={onClick}
    >
      <p className="uppercase font-bold">{label}</p>
      <p className="text-sm">{description}</p>
    </button>
  );
}

function AuthFormWrapper({
  label,
  children,
  description,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="py-2">
      <h2 className="font-bold text-sm mb-2 capitalize">{label}</h2>
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}
      {children}
    </div>
  );
}
