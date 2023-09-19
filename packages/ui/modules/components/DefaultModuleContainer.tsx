"use client";

import { SecretAPI, useComplexSecrets } from "../../state/apiSession/SecretAPI";
import { CollectionModule, ModuleSetting } from "..";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { ComponentModuleContainer } from "../components/ComponentModuleContainer";
import { ModuleSettings } from "../authConfigs";
import { DiscordLink } from "../../components/CommonLinks";
import { FormFieldWrapper } from "./FormFieldWrapper";
import { SingleAuthConfig, isSingleAuthConfig } from "types/database";

export function DefaultModuleContainer({
  module,
}: {
  module: CollectionModule;
}) {
  // Make this only work for single API key for now
  const ModuleSetting = ModuleSettings[module];

  if (!ModuleSetting) {
    return (
      <div className="p-4">
        No Module setup. Please report to our <DiscordLink />.
      </div>
    );
  }

  return (
    <ComponentModuleContainer module={ModuleSetting}>
      {ModuleSetting.authConfigs && (
        <>
          {isSingleAuthConfig(ModuleSetting.authConfigs) ? (
            <AuthModule
              authConfig={ModuleSetting.authConfigs}
              module={ModuleSetting.module}
            />
          ) : (
            <div>Multiple config not supported yet</div>
          )}
        </>
      )}
    </ComponentModuleContainer>
  );
}

function AuthModule({
  authConfig,
  module,
}: {
  authConfig: SingleAuthConfig;
  module: CollectionModule;
}) {
  const SINGLE_API_KEY = SecretAPI.getSecretKeyFromConfig(authConfig, module);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<{ API_KEY: string }>();

  const onSubmit = handleSubmit((data) => {
    updateSecrets([
      {
        secretId: SINGLE_API_KEY,
        secretValue: data.API_KEY,
      },
    ]);

    reset(undefined, { keepValues: true });
  });

  const { updateSecrets, hasAuthSetup } = useComplexSecrets({
    collection: module,
    onSave(secrets) {
      if (secrets) {
        setValue("API_KEY", secrets[SINGLE_API_KEY] || "");
      }
    },
  });

  return (
    <>
      <form className="border p-4 rounded-md" onSubmit={onSubmit}>
        {!hasAuthSetup && (
          <div className="alert alert-error flex items-center gap-x-2 mb-4 text-sm">
            <InformationCircleIcon className="h-6" />
            <span className="mt-0.5">Setup auth here!</span>
          </div>
        )}
        <h2 className="text-xl font-bold">Auth</h2>

        <div className="bg-base-300 dark:bg-neutral rounded-md p-4 mt-4">
          <FormFieldWrapper
            label={`[${authConfig.type.toUpperCase()}] ${
              authConfig.payload?.name || "Authorization"
            }`}
            description={authConfig.payload?.description}
          >
            <input
              className="input input-bordered input-sm w-full"
              {...register("API_KEY", { required: false })}
            />
          </FormFieldWrapper>

          <div className="mt-4 space-x-2">
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  setValue("API_KEY", "");
                  onSubmit(e);
                }}
              >
                Clear
              </button>
              <button
                className="btn btn-accent btn-sm"
                disabled={!isDirty}
                type="submit"
              >
                Save
              </button>
            </>
          </div>
        </div>
      </form>
    </>
  );
}
