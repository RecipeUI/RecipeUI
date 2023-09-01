import { useRecipeSessionStore } from "../../../state/recipeSession";
import { RecipeOutputType, RecipeTemplateFragment } from "types/database";
import { FORM_LINKS } from "../../../utils/constants/main";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";
import classNames from "classnames";
import { usePostHog } from "posthog-js/react";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ProjectScope } from "types/enums";
import {} from "../../../utils/main";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import { useMiniRecipes, useOutput } from "../../../state/apiSession";
import { differenceInMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";
export function RecipeSaveButton() {
  const currentSesssion = useRecipeSessionStore(
    (state) => state.currentSession
  );
  const {
    output: { type, output, duration, requestInfo, created_at },
  } = useOutput(currentSesssion?.id);

  const isSending = useRecipeSessionStore((state) => state.isSending);
  const hasValidResponse = type === RecipeOutputType.Response;
  const user = useRecipeSessionStore((state) => state.user);

  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const editorMode = useRecipeSessionStore((state) => state.editorMode);
  const [glowing, setGlowing] = useState(true);

  const [hide, setHide] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (created_at) {
      const minutes = differenceInMinutes(new Date(), new Date(created_at));

      // Do 3 seconds ago
      if (minutes <= 1) {
        setGlowing(true);
        timer = setTimeout(() => {
          setGlowing(false);
        }, 3000);
      }

      if (minutes > 5) {
        setHide(true);
      }
    } else {
      setGlowing(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [created_at]);

  if (!hasValidResponse || isSending || !editorMode || !output || hide) {
    return null;
  }

  return (
    <>
      <div
        className="hidden sm:block tooltip tooltip-left tooltip-info"
        data-tip="Convert to a reusable recipe and share with people!"
      >
        <button
          className={classNames(
            "btn dark:text-white sm:w-24 w-full",
            "bg-chefYellow !text-black hover:btn-info"
            // glowing && "animate-bounce"
          )}
          type="button"
          onClick={() => {
            // if (!user) {
            //   document.getElementById(UNIQUE_ELEMENT_IDS.SIGN_IN)?.click();
            //   return;
            // }

            setShowCreationFlow(true);
          }}
        >
          Save
        </button>
      </div>
      {showCreationFlow && (
        <RecipeCreationFlow
          onClose={() => {
            setShowCreationFlow(false);
          }}
        />
      )}
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

  const { addRecipe } = useMiniRecipes(session?.recipeId);
  const {
    output: { requestInfo, duration, output, type },
  } = useOutput(session?.id);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = useSupabaseClient();

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
          output,
          streaming: false,
        },
        project_scope: ProjectScope.Personal,

        queryParams:
          editorQuery && editorQuery.length > 0
            ? JSON.parse(editorQuery)
            : null,
        requestBody:
          (requestInfo?.payload.body as Record<string, unknown>) || null,
        urlParams:
          urlParamCode && urlParamCode !== "{}"
            ? JSON.parse(urlParamCode)
            : null,

        recipe_id: session?.recipeId!,

        // This part wrong
        headers: editorHeaders as any,

        // Unnecessary
        original_author_id: null,
      };

      addRecipe(newRecipe)
        .then(() => {
          posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_CREATE);
          setLoading(false);

          onClose();
        })
        .catch((e) => {
          setLoading(false);
        });
    } catch (e) {
      alert("Recipe failed to make");
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

                {errorMsg && (
                  <div className="alert alert-error !mt-4 flex flex-col items-start">
                    <p>{errorMsg}</p>
                    <p>Want to be an early RecipeUI power user?</p>
                    <a
                      href={FORM_LINKS.RECIPEUI_PRO}
                      target="_blank"
                      className="underline underline-offset-2 -mt-4"
                    >
                      Sign up here.
                    </a>
                  </div>
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
