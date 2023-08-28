"use client";

import { useEffect, useState } from "react";
import { useRecipeSessionStore } from "ui/state/recipeSession";
import { useDebounce } from "usehooks-ts";
import { produce } from "immer";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useSecretManager, useSecretsFromSM } from "ui/state/recipeAuth";
import { RecipeAuthType } from "types/enums";
import classNames from "classnames";
import { deleteSecret, getSecret, saveSecret } from "ui/state/apiSession";

export function EditorAuth() {
  const editorAuth = useRecipeSessionStore((state) => state.editorAuth);
  const setEditorAuth = useRecipeSessionStore((state) => state.setEditorAuth);

  const currentSession = useRecipeSessionStore(
    (state) => state.currentSession
  )!;

  const [secret, setSecret] = useState("");
  const [hasChanged, setHasChanged] = useState(false);
  const [meta, setMeta] = useState<string | undefined>("");
  const [docs, setDocs] = useState<string | undefined>("");

  useEffect(() => {
    if (editorAuth === null) {
      setMeta("");
      setDocs("");
    } else {
      setMeta(editorAuth.meta);
      setDocs(editorAuth.docs);
    }
  }, [editorAuth]);

  useEffect(() => {
    getSecret({ secretId: currentSession.recipeId }).then((secret) => {
      setSecret(secret || "");
    });
  }, [currentSession?.recipeId]);

  return (
    <div className="flex-1 ">
      {editorAuth !== null && (
        <div className="py-2 border-b p-4 pb-4">
          {editorAuth.type === RecipeAuthType.Query && (
            <AuthFormWrapper label="Query Param Name">
              <input
                type="text"
                className={classNames(
                  "input input-bordered w-full input-sm",
                  !meta && "input-error"
                )}
                placeholder="Input secret here"
                value={meta}
                onChange={(e) => {
                  if (!hasChanged) setHasChanged(true);

                  setMeta(e.target.value);
                }}
              />
            </AuthFormWrapper>
          )}
          <AuthFormWrapper label={`${editorAuth.type} Secret`}>
            <input
              type="text"
              className={classNames(
                "input input-bordered w-full input-sm",
                !secret && "input-error"
              )}
              placeholder={
                editorAuth.type === RecipeAuthType.Bearer
                  ? "Bearer token here. Do not include 'Bearer' prefix."
                  : "Input secret here"
              }
              value={secret}
              onChange={(e) => {
                if (!hasChanged) setHasChanged(true);

                setSecret(e.target.value);
              }}
            />
          </AuthFormWrapper>
          <AuthFormWrapper label="Auth Documentation">
            <input
              type="text"
              className="input input-bordered w-full input-sm"
              value={docs}
              placeholder="(Optional) Link to docs so your future self or team knows how to authenticate."
              onChange={(e) => {
                if (!hasChanged) setHasChanged(true);

                setDocs(e.target.value);
              }}
            />
          </AuthFormWrapper>
          <div className="space-x-2">
            <button
              className={classNames(
                "btn btn-sm btn-accent mt-2",
                !hasChanged && "btn-disabled"
              )}
              onClick={() => {
                saveSecret({
                  secretId: currentSession!.recipeId,
                  secretValue: secret,
                });

                setEditorAuth({
                  type: editorAuth.type,
                  meta,
                  docs,
                });

                setHasChanged(false);
              }}
            >
              Save changes
            </button>
            <button
              className={classNames(
                "btn btn-sm btn-neutral mt-2",
                !hasChanged && "btn-disabled"
              )}
              onClick={() => {
                setHasChanged(false);
                deleteSecret({
                  secretId: currentSession!.recipeId,
                });
                setSecret("");
                setEditorAuth({
                  type: editorAuth.type,
                  docs: "",
                });

                alert("Deleted secret");
              }}
            >
              Delete secret
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 px-4 py-4">
        <AuthButton
          label="None"
          description="This API request no authentication."
          onClick={() => {
            setEditorAuth(null);
          }}
          selected={editorAuth === null}
        />
        <AuthButton
          label="Bearer"
          description='Very common for APIs. Uses Bearer prefix in "Authorization" header.'
          selected={editorAuth?.type === RecipeAuthType.Bearer}
          onClick={() => {
            setEditorAuth({
              type: RecipeAuthType.Bearer,
              docs: editorAuth?.docs || "",
            });
          }}
        />
        <AuthButton
          label="Query"
          description="An API key in a query parameter."
          selected={editorAuth?.type === RecipeAuthType.Query}
          onClick={() => {
            setEditorAuth({
              type: RecipeAuthType.Query,
              docs: editorAuth?.docs || "",
            });
          }}
        />
        <AuthButton
          label="OAuth (Soon)"
          description="Join our Discord or email us to use this feature now."
          selected={editorAuth?.type === RecipeAuthType.OAuth}
          className="opacity-50 pointer-events-none"
          onClick={() => {}}
        />
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
        "border rounded-md p-4 text-start space-y-2 h-[120px] flex flex-col justify-start",
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <h2 className="font-bold text-sm mb-2 uppercase">{label}</h2>
      {children}
    </div>
  );
}
