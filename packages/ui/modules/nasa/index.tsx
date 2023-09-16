"use client";

import { SecretAPI, useComplexSecrets } from "../../state/apiSession/SecretAPI";
import { CollectionModule } from "..";
import { InformationCircleIcon, LinkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import classNames from "classnames";
import ModuleSettings, { NASA_QUERY_API_KEY_CONFIG } from "./settings";
import { ComponentModuleContainer } from "../components/ComponentModuleContainer";

export default function NASAModule() {
  return (
    <ComponentModuleContainer module={ModuleSettings}>
      <NASAAuthModule />
    </ComponentModuleContainer>
  );
}

const NASA_QUERY_API_KEY = SecretAPI.getSecretKeyFromConfig(
  NASA_QUERY_API_KEY_CONFIG,
  CollectionModule.NASA
);

const NASA_DEMO_KEY = "DEMO_KEY";

function NASAAuthModule() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<{ NASA_QUERY_API_KEY: string }>();

  const api_key = watch("NASA_QUERY_API_KEY");

  const onSubmit = handleSubmit((data) => {
    updateSecrets([
      {
        secretId: NASA_QUERY_API_KEY,
        secretValue: data.NASA_QUERY_API_KEY,
      },
    ]);

    reset(undefined, { keepValues: true });
  });

  const { updateSecrets, hasAuthSetup } = useComplexSecrets({
    collection: CollectionModule.NASA,
    onSave(secrets) {
      if (secrets) {
        setValue("NASA_QUERY_API_KEY", secrets[NASA_QUERY_API_KEY] || "");
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
              setValue("NASA_QUERY_API_KEY", NASA_DEMO_KEY);
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
        <div className="border rounded-md p-4 mt-4">
          <div>
            <label className="mb-2 text-sm font-bold block">API Key</label>
            <input
              className="input input-bordered input-sm w-full"
              {...register("NASA_QUERY_API_KEY", { required: false })}
            />
          </div>
          <div className="mt-4 space-x-2">
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  setValue("NASA_QUERY_API_KEY", "");
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
