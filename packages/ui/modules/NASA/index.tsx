"use client";

import { SecretAPI, useComplexSecrets } from "../../state/apiSession/SecretAPI";
import { CollectionModule } from "types/modules";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import classNames from "classnames";
import ModuleSettings from "./settings";
import { ComponentModuleContainer } from "../components/ComponentModuleContainer";
import { FormFieldWrapper } from "../components/FormFieldWrapper";

export default function Module() {
  return (
    <ComponentModuleContainer
      module={ModuleSettings}
      moduleComponentMapping={{
        Auth: <AuthModule />,
      }}
    />
  );
}

const SINGLE_API_KEY = SecretAPI.getSecretKeyFromConfig(
  ModuleSettings.authConfig,
  ModuleSettings.module
);

const NASA_DEMO_KEY = "DEMO_KEY";

function AuthModule() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
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
    collection: CollectionModule.NASA,
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
            <span className="mt-0.5">
              Setup auth here. Use NASA demo key to get started right away!
            </span>
          </div>
        )}
        <h2 className="text-xl font-bold">Auth</h2>
        <p className="text-sm">
          NASA's API can be used immediately with the api key{" "}
          <button
            className={classNames(
              "btn  btn-xs mr-0.5 tooltip",
              !hasAuthSetup ? "btn-accent" : "btn-outline"
            )}
            onClick={(e) => {
              setValue("API_KEY", NASA_DEMO_KEY);
              onSubmit(e);

              alert("Done! Try making a request.");
            }}
            data-tip="Set key!"
          >
            DEMO_KEY
          </button>
          . For intensive usage, request an API key from them.{" "}
          <a
            className="inline-block underline underline-offset-2 text-sm"
            href="https://docs.recipeui.com/docs/Auth/nasa"
            target="_blank"
          >
            View auth docs.
          </a>
        </p>

        <div className="mt-2 flex gap-x-2"></div>
        <div className="bg-base-300 dark:bg-neutral rounded-md p-4 mt-4">
          <FormFieldWrapper label="API Key">
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
