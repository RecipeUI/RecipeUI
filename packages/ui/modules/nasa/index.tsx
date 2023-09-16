"use client";

/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import { SecretAPI, useComplexSecrets } from "../../state/apiSession/SecretAPI";
import { CollectionModule } from "..";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import classNames from "classnames";
import { NASA_DEMO_KEY, NASA_QUERY_API_KEY_CONFIG } from "./constants";

export const NASA_QUERY_API_KEY = SecretAPI.getSecretKeyFromConfig(
  NASA_QUERY_API_KEY_CONFIG,
  CollectionModule.NASA
);

export default function NASAModule() {
  return (
    <div className="h-full space-y-4 p-4">
      <div className="flex items-center border p-4 rounded-md  text-white">
        <div className="ml-2">
          <h2 className="text-xl font-bold">NASA</h2>
          <p className="text-sm">
            Use NASA api's to get the latest imagery and insights about Earth,
            Mars, and more about the Solar System.
          </p>
          <div className="mt-2">
            <div className="badge badge-neutral">Free</div>
          </div>
        </div>
        <img
          src="https://api.nasa.gov/assets/img/favicons/favicon-192.png"
          className="w-24"
        />
      </div>
      <NasaAuthModule />
    </div>
  );
}

function NasaAuthModule() {
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
    console.log("here", data.NASA_QUERY_API_KEY);
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

  const [showAPITutorial, setShowAPITutorial] = useState(false);

  return (
    <>
      <form className="border p-4 rounded-md" onSubmit={onSubmit}>
        {!hasAuthSetup && (
          <div className="alert alert-error flex items-center gap-x-2 mb-4">
            <InformationCircleIcon className="h-6" />
            <span className="mt-0.5">Setup auth.</span>
          </div>
        )}
        <h2 className="text-xl font-bold">Auth</h2>
        <p className="text-sm">
          NASA's API can be used immediately with their demo key. For intensive
          usage, request an API key from them.
        </p>

        <div className="mt-2 flex gap-x-2">
          <button
            className={classNames(
              "btn  btn-xs",
              !hasAuthSetup ? "btn-accent" : "btn-neutral",
              api_key === NASA_DEMO_KEY && "hidden"
            )}
            onClick={(e) => {
              setValue("NASA_QUERY_API_KEY", NASA_DEMO_KEY);
              onSubmit(e);
            }}
          >
            Use Demo Key
          </button>
          {!showAPITutorial && (
            <button
              className="btn btn-neutral btn-xs"
              onClick={() => setShowAPITutorial(true)}
            >
              View Auth Docs
            </button>
          )}
        </div>
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
