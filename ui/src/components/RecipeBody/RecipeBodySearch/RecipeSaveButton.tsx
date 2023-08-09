import { createTemplate } from "@/components/RecipeBody/RecipeBodySearch/actions";
import {
  RecipeContext,
  RecipeOutputType,
  RecipeParameters,
  useRecipeSessionStore,
} from "@/state/recipeSession";
import { Recipe } from "@/types/databaseExtended";
import { UNIQUE_ELEMENT_IDS } from "@/utils/constants";
import { getURLParamsForSession } from "@/utils/main";
import { POST_HOG_CONSTANTS } from "@/utils/posthogConstants";
import { Dialog } from "@headlessui/react";
import classNames from "classnames";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import {
  ReactNode,
  startTransition,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";

export function RecipeSaveButton() {
  const { type } = useRecipeSessionStore((state) => state.getOutput());
  const isSending = useRecipeSessionStore((state) => state.isSending);
  const hasValidResponse = type === RecipeOutputType.Response;
  const user = useRecipeSessionStore((state) => state.user);

  const [showCreationFlow, setShowCreationFlow] = useState(false);

  if (!hasValidResponse || isSending) {
    return null;
  }

  return (
    <>
      <div
        className="tooltip tooltip-left tooltip-info"
        data-tip="Convert to a reusable recipe and share with people!"
      >
        <button
          className={classNames(
            "btn dark:text-white sm:w-24 w-full",
            "bg-chefYellow !text-black hover:btn-info"
          )}
          type="button"
          onClick={() => {
            if (!user) {
              document.getElementById(UNIQUE_ELEMENT_IDS.SIGN_IN)?.click();
              return;
            }

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
  const user = useRecipeSessionStore((state) => state.user)!;
  const recipe = useContext(RecipeContext)!;
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const urlParams = useRecipeSessionStore((state) => state.urlParams);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeCreateFormData>({
    defaultValues: {},
  });

  const [loading, setLoading] = useState(false);
  const [newTemplateId, setNewTemplateId] = useState<number | null>(null);
  const posthog = usePostHog();

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);

    try {
      const newTemplate = await createTemplate({
        author_id: user.user_id,
        original_author_id: user.user_id,
        project: recipe.project,
        recipe_id: recipe.id,
        requestBody,
        // @ts-expect-error I think we actually have a TS bug here
        queryParams,
        urlParams,
        ...data,
      });

      if (newTemplate) {
        posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_CREATE, {
          template_id: newTemplate.id,
          template_project: newTemplate.project,
          recipe_id: recipe.id,
          recipe_path: recipe.path,
        });
        setNewTemplateId(newTemplate.id);
      }
    } catch (e) {
      alert("Recipe failed to make");
      console.error(e);
    }

    setLoading(false);
  });

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[500px]">
          {!newTemplateId ? (
            <>
              <Dialog.Title className="text-2xl font-bold ">
                New {recipe.project} Recipe
              </Dialog.Title>
              <Dialog.Description
                as="div"
                className="p-2 text-sm border rounded-md my-2"
              >
                <h3 className="font-bold text-base">{recipe.title}</h3>
                <h3 className="">{recipe.path}</h3>
                <p className="line-clamp-2">{recipe.summary}</p>
              </Dialog.Description>

              <form
                className="flex flex-col space-y-2 border rounded-md p-8"
                onSubmit={onSubmit}
              >
                {!newTemplateId && (
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
                )}

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
          ) : (
            <SucessAnimation onClose={onClose} newTemplateId={newTemplateId} />
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function SucessAnimation({
  onClose,
  newTemplateId,
  passiveRecipe,
}: {
  onClose: () => void;
  newTemplateId: number;
  passiveRecipe?: Pick<Recipe, "title" | "id" | "method">;
}) {
  const router = useRouter();
  const recipe = useContext(RecipeContext)! ?? passiveRecipe!;
  const addSession = useRecipeSessionStore((state) => state.addSession);

  useEffect(() => {
    setTimeout(() => {
      const newSession = addSession(recipe);
      onClose();
      router.push(
        `/?${getURLParamsForSession(newSession, {
          newTemplateId: String(newTemplateId),
        })}`
      );
    }, 4000);
  }, []);

  return <img src={"/animated.gif"} alt="visual" className="w-full h-full" />;
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
