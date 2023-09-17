import {
  RecipeBodyRoute,
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeOutputType, RecipeTemplateFragment } from "types/database";
import {
  FORM_LINKS,
  PLAYGROUND_SESSION_ID,
} from "../../../utils/constants/main";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";
import classNames from "classnames";
import { usePostHog } from "posthog-js/react";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ProjectScope } from "types/enums";

import { restrictObjectsAndArrays } from "utils";

import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import { MiniRecipeAPI, useMiniRecipes } from "../../../state/apiSession";
import { useOutput } from "../../../state/apiSession/OutputAPI";
import { differenceInMinutes, differenceInSeconds } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { parse } from "json5";

export function RecipeSaveButton() {
  const currentSesssion = useRecipeSessionStore(
    (state) => state.currentSession
  );
  const {
    output: { type, output, duration, requestInfo, created_at, id },
  } = useOutput(currentSesssion?.id);

  const [showCreationFlow, setShowCreationFlow] = useState(false);

  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    if (!created_at) return;

    const secondsAgo = Math.abs(
      differenceInSeconds(new Date(), new Date(created_at))
    );

    if (secondsAgo >= 10) return;

    setBouncing(true);

    let bouncingTimer = setTimeout(() => {
      setBouncing(false);
    }, 500);

    return () => {
      clearTimeout(bouncingTimer);
    };
  }, [id]);

  if (
    ![RecipeOutputType.Response].includes(type) ||
    !created_at ||
    currentSesssion?.id === PLAYGROUND_SESSION_ID
  ) {
    return null;
  }

  return (
    <>
      <div
        className="hidden sm:block tooltip tooltip-bottom tooltip-info z-20 bg-inherit"
        data-tip="Save all your params so you can quickly re-run this later."
      >
        <button
          className={classNames(
            "btn btn-xs  dark:text-white btn-primary",
            bouncing && "animate-bounce"
          )}
          type="button"
          onClick={() => {
            setShowCreationFlow(true);
          }}
        >
          Save
        </button>
        {showCreationFlow && (
          <RecipeCreationFlow onClose={() => setShowCreationFlow(false)} />
        )}
      </div>
    </>
  );
}

interface RecipeCreateFormData {
  title: string;
  description: string;
}

export function RecipeCreationFlow({ onClose }: { onClose: () => void }) {
  const editorHeaders = useRecipeSessionStore((state) => state.editorHeaders);
  const editorQuery = useRecipeSessionStore((state) => state.editorQuery);

  const urlParamCode = useRecipeSessionStore((state) => state.editorURLCode);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeCreateFormData>({
    defaultValues: {},
  });

  const [loading, setLoading] = useState(false);
  const posthog = usePostHog();
  const session = useRecipeSessionStore((state) => state.currentSession);

  // TODO: This is not proper right now
  const {
    output: { requestInfo, duration, output, type },
  } = useOutput(session?.id);

  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);

    try {
      const newRecipe: RecipeTemplateFragment = {
        title: data.title,
        description: data.description,

        created_at: new Date().toISOString(),
        id: uuidv4(),
        replay: {
          duration: duration ? duration : 3000,
          output: restrictObjectsAndArrays(output),
          streaming: false,
        },
        project_scope: ProjectScope.Personal,

        queryParams:
          editorQuery && editorQuery.length > 0 ? parse(editorQuery) : null,
        requestBody:
          (requestInfo?.payload.body as Record<string, unknown>) || null,
        urlParams:
          urlParamCode && urlParamCode !== "{}" ? parse(urlParamCode) : null,

        recipe_id: session?.recipeId!,

        headers: editorHeaders,

        // Unnecessary
        original_author_id: null,
      };

      MiniRecipeAPI.addRecipe(session!.recipeId, newRecipe)
        .then(() => {
          posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_CREATE);
          setLoading(false);
          setBodyRoute(RecipeBodyRoute.Templates);
          onClose();
        })
        .catch((e) => {
          setLoading(false);
        });
    } catch (e) {
      alert("Recipe failed to make. Check console for errors");
      console.error(e);
    }
  });

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[500px]">
          <>
            <Dialog.Title className="text-2xl font-bold ">
              {`New recipe`}
            </Dialog.Title>
            <p>
              Recipes allow you to save all the params you had before so you can
              quickly reference, share, or reuse this API in the future.
            </p>
            <form
              className="flex flex-col space-y-2  rounded-md mt-4"
              onSubmit={onSubmit}
            >
              <>
                <LabelWrapper label="Recipe Title">
                  <input
                    className="input input-bordered w-full"
                    {...register("title", { required: true })}
                  />
                </LabelWrapper>
                <LabelWrapper label="Recipe Description">
                  <input
                    className="input  input-bordered w-full"
                    {...register("description", { required: true })}
                  />
                </LabelWrapper>

                {(errors.title || errors.description) && (
                  <p className="alert alert-error !mt-4">
                    Please fill out all required fields.
                  </p>
                )}
              </>

              <button
                type="submit"
                className={classNames(
                  "btn bg-chefYellow !mt-8 text-black",
                  loading && "btn-disabled"
                )}
              >
                Save
                {loading && <span className="loading loading-bars"></span>}
              </button>
            </form>
          </>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function LabelWrapper({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="label text-sm">{label}</label>
      {children}
    </div>
  );
}
