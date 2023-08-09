import { startTransition, useContext, useState } from "react";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import {
  RecipeMutationCore,
  UserTemplatePreview,
} from "@/types/databaseExtended";
import { getTemplate } from "@/components/RecipeBody/actions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import classNames from "classnames";
import {
  cloneTemplate,
  createTemplate,
  deleteTemplate,
} from "@/components/RecipeBody/RecipeBodySearch/actions";
import { revalidatePath } from "next/cache";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "@/utils/posthogConstants";
import { Dialog } from "@headlessui/react";
import {
  DB_FUNC_ERRORS,
  FORM_LINKS,
  UNIQUE_ELEMENT_IDS,
} from "@/utils/constants";
import { SucessAnimation } from "@/components/RecipeBody/RecipeBodySearch/RecipeSaveButton";

export function RecipeTemplatesTab() {
  const selectedRecipe = useContext(RecipeContext)!;

  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);
  const templates = selectedRecipe.templates || [];

  const userTemplates = selectedRecipe.userTemplates || [];

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto space-y-8">
        <UserTemplates />
        <StarterTemplates />
      </div>
    </div>
  );
}

export function StarterTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;

  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);
  const templates = selectedRecipe.templates || [];

  if (templates.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Starter Recipes</h1>
      <p className="mt-2">
        Use some of these recipes below to quickly prefill the editor. You can
        also create your own later!
      </p>
      <div className="flex-1 grid grid-cols-2 gap-2 mt-4">
        {templates.map((template) => {
          return (
            <div
              className="border rounded-sm p-4 space-y-2 flex flex-col"
              key={`${template.title}`}
            >
              <h3 className="font-bold">{template.title}</h3>
              <p className="text-sm line-clamp-3">{template.description}</p>
              <div className="flex-1" />
              <button
                className="btn btn-sm btn-neutral w-fit"
                onClick={() => {
                  if (template.requestBody) {
                    setRequestBody(template.requestBody);
                  }

                  if (template.queryParams) {
                    setQueryParams(template.queryParams);
                  }

                  if (template.urlParams) {
                    setUrlParams(template.urlParams);
                  }

                  setBodyRoute(RecipeBodyRoute.Parameters);
                }}
              >
                Use
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UserTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;
  const userTemplates = selectedRecipe.userTemplates || [];
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);

  const searchParams = useSearchParams();

  const newTemplateId = searchParams.get("newTemplateId");
  const user = useRecipeSessionStore((state) => state.user);

  const router = useRouter();
  const posthog = usePostHog();

  if (userTemplates.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Your Recipes</h1>
      <div className="flex-1 grid grid-cols-2 gap-2 mt-4">
        {userTemplates.map((template) => {
          return (
            <div
              className={classNames(
                "border rounded-sm p-4 space-y-2 flex flex-col ",
                newTemplateId === String(template.id) &&
                  "border-chefYellow border-4 border-dashed"
              )}
              key={`${template.id}`}
            >
              {user && template.original_author.user_id !== user?.user_id && (
                <p className="text-xs">
                  Forked from @{template.original_author.username}
                </p>
              )}
              <h3 className="font-bold">{template.title}</h3>

              <p className="text-sm line-clamp-3">{template.description}</p>

              <div className="flex-1" />
              <div className="space-x-2">
                <button
                  className="btn btn-xs btn-neutral w-fit"
                  onClick={async () => {
                    const templateInfo = await getTemplate(template.id);

                    if (!templateInfo) {
                      alert("Failed to find template");
                      return;
                    }

                    if (templateInfo.requestBody) {
                      setRequestBody(templateInfo.requestBody);
                    }

                    if (templateInfo.queryParams) {
                      setQueryParams(templateInfo.queryParams);
                    }

                    if (templateInfo.urlParams) {
                      setUrlParams(templateInfo.urlParams);
                    }

                    setBodyRoute(RecipeBodyRoute.Parameters);

                    posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_USE, {
                      template_id: template.id,
                      template_project: selectedRecipe.project,
                      recipe_id: selectedRecipe.id,
                      recipe_path: selectedRecipe.path,
                    });
                  }}
                >
                  Use
                </button>
                <ShareRecipeButton template={template} />
                <button
                  className="btn btn-xs btn-neutral w-fit"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this?")) {
                      return;
                    }

                    const deletedTemplate = await deleteTemplate(template.id);
                    if (deletedTemplate) {
                      posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_CREATE, {
                        template_id: template.id,
                        template_project: selectedRecipe.project,
                        recipe_id: selectedRecipe.id,
                        recipe_path: selectedRecipe.path,
                      });

                      router.refresh();
                      alert("Template deleted");
                      return;
                    }
                  }}
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShareRecipeButton({ template }: { template: UserTemplatePreview }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className="btn btn-xs btn-neutral w-fit"
        onClick={() => {
          setShowModal(true);
        }}
      >
        Share
      </button>
      {showModal && (
        <ShareModal
          template={template}
          onClose={() => {
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

export function ShareModal({
  template,
  onClose,
}: {
  template: UserTemplatePreview;
  onClose: () => void;
}) {
  const [onAction, setOnAction] = useState(false);
  const posthog = usePostHog();

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
          <TemplateMockCode template={template} />

          <button
            className="btn btn-accent w-full mt-4"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${window.location.origin}/r/${template.alias}`
              );

              posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
                template_id: template.id,
                template_project: template.recipe.project,
                recipe_title: template.recipe.title,
              });
              setOnAction(true);
            }}
          >
            {onAction ? "Copied to clipboard" : "Share"}
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function ShareInviteModal({
  template,
  onClose,
}: {
  template: UserTemplatePreview;
  onClose: () => void;
}) {
  const [isForking, setIsForking] = useState(false);
  const posthog = usePostHog();
  const user = useRecipeSessionStore((state) => state.user);

  const [newTemplateId, setNewTemplateId] = useState<number | null>(null);

  const [limitedForks, setLimitedForks] = useState(false);

  return (
    <Dialog open={true} onClose={onClose} className="relative z-20">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
          <TemplateMockCode template={template} />
          {newTemplateId === null ? (
            <button
              className="btn btn-accent w-full mt-4"
              onClick={async () => {
                if (!user) {
                  posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
                    template_id: template.id,
                    template_project: template.recipe.project,
                    recipe_title: template.recipe.title,
                  });
                  document.getElementById(UNIQUE_ELEMENT_IDS.SIGN_IN)?.click();
                  onClose();
                } else {
                  setIsForking(true);
                  const { newTemplate, error } = await cloneTemplate(
                    template.id
                  );

                  if (newTemplate) {
                    posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_FORKED, {
                      new_template_id: newTemplate.id,
                      old_template_id: template.id,
                      template_project: template.recipe.project,
                      recipe_title: template.recipe.title,
                    });

                    setNewTemplateId(newTemplate.id);
                  } else if (error === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED) {
                    setLimitedForks(true);
                  }
                  setIsForking(false);
                }
              }}
            >
              {!user ? "Login to fork" : "Fork this recipe"}
              {isForking && <span className="loading loading-bars" />}
            </button>
          ) : (
            <SucessAnimation
              onClose={onClose}
              newTemplateId={newTemplateId}
              passiveRecipe={template.recipe}
            />
          )}

          {limitedForks && (
            <div className="alert alert-error !mt-4 flex flex-col items-start">
              <p>{`We love that you're making so many recipes but we're currently limiting users to 10 recipes right now to scale properly. Please delete some recipes and try again.`}</p>
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function TemplateMockCode({
  template,
}: {
  template: UserTemplatePreview;
}) {
  return (
    <div className="mockup-code h-full w-full">
      <pre className="px-4 py-2 whitespace-pre-wrap">
        <p className="text-xs font-bold">
          {template.recipe.project} | {template.recipe.title}
        </p>
        <p className="text-xs font-bold">
          Created by @{template.original_author.username}
        </p>

        <div className="flex-1 mt-8">
          <h3 className="font-bold text-lg">{template.title}</h3>
          <p className="text-sm ">{template.description}</p>
        </div>
      </pre>
    </div>
  );
}
