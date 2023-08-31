"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { shell } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api";
import { Database } from "types/database";

import { useForm } from "react-hook-form";
import classNames from "classnames";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { listen } from "@tauri-apps/api/event";
import { getUrl } from "../../../utils/main";
import { Provider, AuthForm, providersInfo, View } from "./providers";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import { useSessionStorage } from "usehooks-ts";
import { REDIRECT_PAGE } from "../../../utils/constants/main";

export default function HybridAuthForm({
  providers = [],
}: {
  providers?: Provider[];
}) {
  const supabase = useSupabaseClient();
  const portRef = useRef<number | null>(null);
  const isTauri = useIsTauri();
  useEffect(() => {
    const unlisten = isTauri
      ? listen("oauth://url", (data) => {
          if (!data.payload) return;

          const url = new URL(data.payload as string);
          const code = new URLSearchParams(url.search).get("code");
          if (code) {
            supabase.auth
              .exchangeCodeForSession(code)
              .then(({ data, error }) => {
                if (error) {
                  console.error(error);
                  return;
                }
              });
          }
        })
      : null;

    if (isTauri) {
      invoke("plugin:oauth|start", {
        // config: {
        // Add a nicer UI for the call back
        //   response: callbackTemplate,
        // },
      }).then(async (port) => {
        portRef.current = port as number;
      });
    }

    () => {
      if (isTauri) {
        unlisten?.then((u) => u());
        invoke("plugin:oauth|cancel", { port: portRef.current });
      }
    };
  }, [isTauri, supabase.auth]);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<View>(View.SignIn);
  const [_, setRedirectURL] = useSessionStorage<string | null>(
    REDIRECT_PAGE,
    null
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AuthForm>({});

  const onSubmit = handleSubmit(async (formInfo) => {
    setLoading(true);
    setError(null);

    if (!portRef.current && isTauri) {
      setError("Login failed. Close window and try again");
    }

    if (viewMode === View.SignIn) {
      const { error } = await supabase.auth.signInWithPassword({
        email: formInfo.email,
        password: formInfo.password,
      });

      if (error) {
        setError(error?.message);
      }
    } else {
      if (passwordValue !== formInfo.passwordConfirm) {
        setError("Passwords do not match");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formInfo.email,
          password: formInfo.password,
          options: {
            emailRedirectTo: isTauri
              ? `http://localhost:${portRef.current}`
              : `${getUrl()}/auth/callback`,
          },
        });

        if (!error) {
          setMessage("Check your email for a confirmation link");
        }
      }
    }

    setLoading(false);
  });

  const [showPassword, setShowPassword] = useState(false);
  const passwordValue = watch("password", "");

  const onProviderLogin = async (provider: Provider) => {
    setError(null);
    if (!portRef.current && isTauri) {
      setError("Login failed. Close window and try again");
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        skipBrowserRedirect: true,
        scopes: provider === Provider.Google ? "profile email" : "",
        redirectTo: isTauri
          ? `http://localhost:${portRef.current}`
          : `${getUrl()}/auth/callback`,
      },
      provider: provider,
    });

    if (data.url) {
      if (isTauri) {
        shell.open(data.url);
      } else {
        location.href = data.url;
        setRedirectURL(location.href);
      }
    } else {
      setError("Login failed. Close window and try again");
    }
  };

  const providerInfoMap = useMemo(() => {
    return providers
      .map(
        (provider) => providersInfo.find(({ provider: p }) => p === provider)!
      )
      .filter(Boolean)!;
  }, [providers]);

  return (
    <div className="mt-2">
      <div className="space-y-2">
        {providerInfoMap.map(({ icon: Icon, provider }) => {
          return (
            <div key={provider} className="space-y-2">
              <button
                className="btn w-full"
                onClick={() => onProviderLogin(provider)}
              >
                <Icon />
                {viewMode === View.SignIn ? "Log in" : "Sign up"} with{" "}
                {provider}
              </button>
            </div>
          );
        })}
      </div>
      {providers.length > 0 && <div className="divider" />}
      <form className="" onSubmit={onSubmit}>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="text"
            placeholder="e.g john@gmail.com"
            className={classNames(
              "input input-bordered w-full",
              errors.email && "input-error"
            )}
            {...register("email", {
              required: true,
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Please enter a valid email",
              },
            })}
          />
        </div>
        <div className="form-control w-full mt-2 relative">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder=""
              className={classNames(
                "input input-bordered w-full",
                errors.password && "input-error"
              )}
              {...register("password", {
                required: true,
                minLength: {
                  value: 5,
                  message: "Please make your password longer",
                },
              })}
            />
            <button
              className="absolute right-4 bottom-4"
              onClick={(e) => {
                e.preventDefault();
                setShowPassword(!showPassword);
              }}
            >
              {showPassword ? (
                <EyeIcon className="w-4 h-4" />
              ) : (
                <EyeSlashIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        {passwordValue && viewMode === View.SignUp && (
          <div className="form-control w-full mt-2 relative">
            <label className="label">
              <span className="label-text">Confirm Password</span>
            </label>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder=""
                className={classNames(
                  "input input-bordered w-full",
                  errors.password && "input-error"
                )}
                {...register("passwordConfirm", { required: false })}
              />
              <button
                className="absolute right-4 bottom-4"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPassword(!showPassword);
                }}
              >
                {showPassword ? (
                  <EyeIcon className="w-4 h-4" />
                ) : (
                  <EyeSlashIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {(errors.email || errors.password) && (
          <ul className="text-sm list-disc mx-4 mt-4">
            {Object.values(errors).map((error) =>
              error.message ? (
                <li className="text-error" key={error.message}>
                  {error.message}
                </li>
              ) : null
            )}
          </ul>
        )}
        <div className="my-2">
          {error && <p className="text-red-600">{error}</p>}
          {message && <p className="font-bold">{message}</p>}
        </div>

        <button
          className="btn bg-chefYellow w-full text-black mt-4"
          disabled={loading}
        >
          {viewMode === View.SignIn ? "Log in" : "Sign up"}{" "}
          {loading && <span className="loading loading-bars ml-2" />}
        </button>
      </form>
      <div className="mt-2 text-sm">
        <button
          className="cursor-pointer"
          onClick={() => {
            setViewMode(viewMode === View.SignIn ? View.SignUp : View.SignIn);
          }}
        >
          {viewMode === View.SignIn ? (
            <>
              New? Create an account <span className="underline">here</span>.
            </>
          ) : (
            <>
              Already have an account? Log in{" "}
              <span className="underline">here</span>.
            </>
          )}
        </button>
      </div>
    </div>
  );
}
