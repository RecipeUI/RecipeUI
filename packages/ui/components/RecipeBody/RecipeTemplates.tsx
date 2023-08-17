import { useContext, useState } from "react";
import {
  RecipeBodyRoute,
  RecipeContext,
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeTemplate, UserTemplatePreview } from "types/database";
import { getTemplate } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import classNames from "classnames";

import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";
import {
  DB_FUNC_ERRORS,
  FORM_LINKS,
  UNIQUE_ELEMENT_IDS,
} from "../../utils/constants/main";
import { SucessAnimation } from "../RecipeBody/RecipeBodySearch/RecipeSaveButton";
import { useLocalStorage } from "usehooks-ts";
import Link from "next/link";
import { ProjectScope } from "types/enums";
import { cloneTemplate, deleteTemplate } from "./RecipeBodySearch/actions";

export function RecipeTemplatesTab() {
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
  const templates = selectedRecipe.templates || [];

  if (templates.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Starter Recipes</h1>
      <p className="mt-2">Use the recipes below to see how to use this API!</p>
      <div className="flex-1 flex flex-col sm:grid grid-cols-2 gap-4 mt-4">
        {templates.map((template) => (
          <StarterTemplateItem key={template.title} template={template} />
        ))}
      </div>
    </div>
  );
}

function StarterTemplateItem({ template }: { template: RecipeTemplate }) {
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const selectedRecipe = useContext(RecipeContext)!;
  const posthog = usePostHog();

  return (
    <div
      className="border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default"
      key={`${template.title}`}
    >
      <h3 className="font-bold">{template.title}</h3>
      <p className="text-sm line-clamp-3">{template.description}</p>
      <div className="flex-1" />
      <div className="flex justify-between">
        <button
          className={classNames(
            "btn btn-sm btn-neutral w-fit",
            loadingTemplate && "btn-disabled"
          )}
          onClick={async () => {
            posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW, {
              template_id: "Core" + template.title,
              template_project: selectedRecipe.project,
              recipe_id: selectedRecipe.id,
              recipe_path: selectedRecipe.path,
            });
            setLoadingTemplate(template);
          }}
        >
          Use
        </button>
      </div>
    </div>
  );
}

export function UserTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;
  const searchParams = useSearchParams();
  const newTemplateId = searchParams.get("newTemplateId");

  const [forkedTemplate, setForkedTemplate] =
    useLocalStorage<UserTemplatePreview | null>(
      UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
      null
    );

  const userTemplates = [
    ...(forkedTemplate && forkedTemplate.recipe.id === selectedRecipe.id
      ? [forkedTemplate]
      : []),
    ...(selectedRecipe.userTemplates || []),
  ];

  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const isTeam = userTemplates.some((ut) => ut.scope === ProjectScope.Team);

  if (userTemplates.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">{isTeam ? "" : "Your "}Recipes</h1>
      <div className="flex-1 flex flex-col sm:grid grid-cols-2 gap-4 mt-4">
        {userTemplates.map((template) => (
          <UserTemplateItem
            key={template.title}
            template={template}
            isLocalFork={forkedTemplate?.id === template.id}
            setForkedTemplate={setForkedTemplate}
            newTemplateId={newTemplateId}
            loadingTemplate={loadingTemplate}
            isTeam={isTeam}
          />
        ))}
      </div>
    </div>
  );
}

function UserTemplateItem({
  template,
  isLocalFork,
  newTemplateId,
  loadingTemplate,
  setForkedTemplate,
  isTeam,
}: {
  template: UserTemplatePreview;
  isLocalFork: boolean;
  newTemplateId: string | null;
  loadingTemplate: RecipeTemplate | null;
  setForkedTemplate: (template: UserTemplatePreview | null) => void;
  isTeam: boolean;
}) {
  const selectedRecipe = useContext(RecipeContext)!;
  const user = useRecipeSessionStore((state) => state.user);
  const posthog = usePostHog();
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);

  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const router = useRouter();

  return (
    <div
      className={classNames(
        "border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default",
        newTemplateId === String(template.id) &&
          "border-chefYellow border-4 border-dashed"
      )}
      key={`${template.id}`}
    >
      {!isTeam ? (
        <>
          {(!user || template.original_author.user_id !== user.user_id) && (
            <Link
              className="text-xs"
              href={`/u/${template.original_author.username}`}
              target="_blank"
            >
              Forked from @{template.original_author.username}
            </Link>
          )}
        </>
      ) : (
        <>
          <Link
            className="text-xs"
            href={`/u/${template.original_author.username}`}
            target="_blank"
          >
            @{template.original_author.username}
          </Link>
        </>
      )}
      <h3 className="font-bold">{template.title}</h3>
      <p className="text-sm line-clamp-3">{template.description}</p>

      <div className="flex-1" />
      <div className="flex space-x-1  sm:block sm:space-x-2">
        <button
          className={classNames(
            "btn btn-sm btn-neutral w-fit",
            loadingTemplate && "btn-disabled"
          )}
          onClick={async () => {
            posthog.capture(POST_HOG_CONSTANTS.SHARED_TEMPLATE_PREVIEW, {
              template_id: template.id,
              template_project: selectedRecipe.project,
              recipe_id: selectedRecipe.id,
              recipe_path: selectedRecipe.path,
            });

            const templateInfo = await getTemplate(template.id);
            if (templateInfo) {
              setLoadingTemplate(templateInfo);
            } else {
              alert("Failed to find template");
            }
          }}
        >
          Use
        </button>

        <div
          className="dropdown hidden sm:inline-block"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <label
            tabIndex={0}
            className={classNames(
              "btn btn-sm btn-neutral",
              loadingTemplate && "btn-disabled"
            )}
          >
            Options
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-20 menu p-2 shadow rounded-box bg-base-300 space-y-2 mt-2"
          >
            <li>
              <button
                className="btn btn-sm btn-neutral w-full"
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

                  setCurrentTab(RecipeOutputTab.Docs);
                  setBodyRoute(RecipeBodyRoute.Parameters);

                  posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW, {
                    template_id: template.id,
                    template_project: selectedRecipe.project,
                    recipe_id: selectedRecipe.id,
                    recipe_path: selectedRecipe.path,
                  });
                }}
              >
                Prefill
              </button>
            </li>
            <li>
              <ShareRecipeButton template={template} />
            </li>
            {(template.original_author.user_id === user?.user_id ||
              template.author_id === user?.user_id) && (
              <li>
                <button
                  className="btn btn-sm btn-neutral w-full"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this?")) {
                      return;
                    }
                    if (isLocalFork) {
                      setForkedTemplate(null);
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
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ShareRecipeButton({ template }: { template: UserTemplatePreview }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className="btn btn-sm btn-neutral w-full"
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

  const [_, setForkedTemplate] = useLocalStorage<UserTemplatePreview | null>(
    UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
    null
  );

  const isCurrentUserTemplate = template.author_id === user?.user_id;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-20">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
          <TemplateMockCode template={template} />
          {newTemplateId === null ? (
            <>
              {isCurrentUserTemplate && (
                <button
                  className="btn btn-accent w-full mt-4"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${window.location.origin}/r/${template.alias}`
                    );

                    alert("Copied to clipboard");
                  }}
                >
                  Share
                </button>
              )}
              <button
                className="btn btn-accent w-full mt-4"
                onClick={async () => {
                  if (isCurrentUserTemplate) {
                    setNewTemplateId(template.id);
                    return;
                  }

                  if (!user) {
                    posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
                      template_id: template.id,
                      template_project: template.recipe.project,
                      recipe_title: template.recipe.title,
                    });

                    setForkedTemplate(template);
                    setNewTemplateId(template.id);
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
                    } else if (
                      error === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED
                    ) {
                      setLimitedForks(true);
                    }
                    setIsForking(false);
                  }
                }}
              >
                {isCurrentUserTemplate ? "Use template" : "Fork this Recipe!"}
                {isForking && <span className="loading loading-bars" />}
              </button>
            </>
          ) : (
            <SucessAnimation
              onClose={onClose}
              newTemplateId={newTemplateId}
              passiveRecipe={template.recipe}
              ignoreAnimation={!!isCurrentUserTemplate}
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
