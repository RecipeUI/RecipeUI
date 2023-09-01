"use client";
import { useRouter } from "next/navigation";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import classNames from "classnames";
import { OnboardingFormData, createUser } from "./actions";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../utils/constants/posthog";
import { FormLabelWrapper } from "./FormLabelWrapper";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Database } from "types/database";
import { useIsTauri } from "../../hooks/useIsTauri";
import { useSupabaseClient } from "../Providers/SupabaseProvider";

export function OnboardingFlow() {
  const supabase = useSupabaseClient();
  const session = useRecipeSessionStore((state) => state.userSession);
  const user = session?.user;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  let defaultFormData: Partial<OnboardingFormData> = {};

  try {
    if (user?.app_metadata.provider === "github" && user.user_metadata) {
      defaultFormData = {
        first: user.user_metadata?.name?.split(" ")[0],
        last: user.user_metadata?.name?.split(" ")[1],
        username: user.user_metadata?.user_name,
        email: user.email,
        profile_pic: user.user_metadata?.avatar_url,
      };
    } else if (
      user?.app_metadata.provider === "google" &&
      user.user_metadata &&
      Object.keys(user.user_metadata).length > 0
    ) {
      const fullName =
        user.user_metadata.full_name || user.user_metadata.name || "";

      const [first, last] = fullName.split(" ");
      const possibleUsername = first + last;

      defaultFormData = {
        first: first,
        last: last,
        username: possibleUsername,
        email: user.email,
        profile_pic: user.user_metadata.picture,
      };
    }
  } catch (err) {
    // TODO Sentry logging
    console.error(err);
  }

  const [userError, setUserError] = useState<string | null>(null);
  const posthog = usePostHog();
  const isTauri = useIsTauri();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      email: user?.email,
      username: userError || undefined,
      ...defaultFormData,
    },
  });

  const [generalError, setGeneralError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setGeneralError(null);

    if (stage === "User Info") {
      const createRes = await createUser(data, supabase);

      if (createRes.status === 409) {
        setUserError(data.username);
      } else if (createRes.error != null) {
        setGeneralError(createRes.error.message);
      }

      setStage("Survey");
    } else {
      posthog?.capture(POST_HOG_CONSTANTS.SIGN_UP, {
        hear_about: data.hear_about,
        use_case: data.use_case,
      });
      if (typeof window !== "undefined") {
        location.reload();
      }
    }
    setLoading(false);
  });

  const [stage, setStage] = useState<"User Info" | "Survey">("User Info");

  useEffect(() => {
    if (!user) router.push("/");
  }, [router, user]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const { ref: inputRefCB, ...usernameProps } = register("username", {
    required: true,
    pattern: /^\S+$/i,
  });

  return (
    <Dialog
      open={true}
      onClose={() => {}}
      className="relative z-50"
      initialFocus={inputRef}
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px] relative">
          <Dialog.Title className="text-2xl font-bold text-chefYellow">
            Welcome to RecipeUI
          </Dialog.Title>
          <Dialog.Description className="pb-4">
            {stage === "User Info"
              ? "We can't wait to see what recipes you build! First things first, lets set up your profile."
              : "Just a few quick q's. This will help us a lot!"}
          </Dialog.Description>
          <button
            className="absolute top-4 right-4"
            tabIndex={2}
            onClick={() => {
              supabase.auth.signOut().then(() => {
                if (isTauri) {
                  location.reload();
                } else {
                  router.refresh();
                }
              });
            }}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <form className="flex flex-col space-y-2" onSubmit={onSubmit}>
            {stage === "User Info" && (
              <>
                <FormLabelWrapper label="Username">
                  <input
                    className="input input-bordered w-full"
                    {...usernameProps}
                    ref={(e) => {
                      inputRefCB(e);
                      inputRef.current = e;
                    }}
                  />
                </FormLabelWrapper>
                <FormLabelWrapper label="Company (Optional)">
                  <input
                    className="input input-bordered w-full"
                    {...register("company")}
                  />
                </FormLabelWrapper>
                <div className="grid grid-cols-2 gap-x-8">
                  <FormLabelWrapper label="First Name">
                    <input
                      className="input input-bordered w-full"
                      {...register("first", { required: true })}
                    />
                  </FormLabelWrapper>
                  <FormLabelWrapper label="Last Name">
                    <input
                      className="input input-bordered w-full"
                      {...register("last", { required: true })}
                    />
                  </FormLabelWrapper>
                </div>
                {(errors.first ||
                  errors.last ||
                  errors.username?.type === "required") && (
                  <p className="alert alert-error !mt-4">
                    Please fill out all required fields.
                  </p>
                )}
                {errors.username?.type === "pattern !mt-4" && (
                  <p className="alert alert-error">Username must be one word</p>
                )}
                {userError && (
                  <p className="alert alert-error !mt-4">
                    Username already exists. Please choose another.
                  </p>
                )}
                {generalError && (
                  <p className="alert alert-error !mt-4">
                    {generalError || ""}
                  </p>
                )}
              </>
            )}

            {stage === "Survey" && (
              <>
                <FormLabelWrapper label="How did you hear about us?">
                  <input
                    className="input input-bordered w-full"
                    {...register("hear_about")}
                  />
                </FormLabelWrapper>
                <FormLabelWrapper label="What are you looking forward to do?">
                  <input
                    className="input input-bordered w-full"
                    {...register("use_case")}
                  />
                </FormLabelWrapper>
              </>
            )}

            <button
              type="submit"
              className={classNames(
                "btn  bg-chefYellow !mt-8 text-black",
                loading && "btn-disabled"
              )}
            >
              {stage === "User Info" ? "Next" : "Submit"}
              {loading && <span className="loading loading-bars"></span>}
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
