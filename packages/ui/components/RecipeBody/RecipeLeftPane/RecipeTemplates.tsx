import { useContext, useState } from "react";
import {
  DesktopPage,
  RecipeBodyRoute,
  RecipeContext,
  RecipeOutputTab,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeTemplate, UserTemplatePreview } from "types/database";
import { useRouter } from "next/navigation";
import classNames from "classnames";

import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";

import { RECIPE_FORKING_ID } from "utils/constants";

import { useSessionStorage } from "usehooks-ts";
import { ProjectScope } from "types/enums";
import { useClipboard, useIsTauri } from "../../../hooks/useIsTauri";
import { RecipeTemplateEdit } from "./RecipeTemplateEdit";
import { RecipeForkTab } from "./RecipeForkTab";

export function RecipeTemplatesTab() {
  const editorMode = useRecipeSessionStore((state) => state.editorMode);

  if (editorMode) {
    return <RecipeTemplateEdit />;
  }

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto space-y-8">
        <StarterTemplates />
      </div>
    </div>
  );
}

export function StarterTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;
  const templates = selectedRecipe.templates || [];

  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");
  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();

  if (templates.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold">Fork API</h1>
        <p className="mt-2">
          This API does not have any sample recipes. Fork it directly to play
          with it!
        </p>
        <button
          className="btn btn-neutral btn-sm mt-4"
          onClick={() => {
            setRecipeFork(`${selectedRecipe.id}`);

            if (isTauri) {
              setDesktopPage({
                page: DesktopPage.Editor,
              });
            } else {
              router.push(`/editor`);
            }
          }}
        >
          Fork
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Example Recipes</h1>
      <p className="mt-2">Use the example below to see how to use this API.</p>
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

  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);
  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const setTemplate = async () => {
    const templateInfo = template;

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
  };

  const isTauri = useIsTauri();
  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);

  return (
    <>
      <div className="border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default">
        <h3 className="font-bold">{template.title}</h3>
        <p className="text-sm line-clamp-3">{template.description}</p>
        <div className="flex-1" />
        <div className="flex space-x-2">
          <button
            className={classNames(
              "btn btn-sm btn-neutral w-fit",
              loadingTemplate && "btn-disabled"
            )}
            onClick={async () => {
              posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW, {
                template_id: "Core" + template.title,
                template_project: selectedRecipe.project,
                recipe_id: selectedRecipe.id,
                recipe_path: selectedRecipe.path,
              });
              setLoadingTemplate(template);
            }}
          >
            Simulate
          </button>
          <button
            className={classNames(
              "btn btn-sm btn-neutral",
              (loadingTemplate || loading) && "btn-disabled"
            )}
            onClick={async () => {
              // If this is desktop, then we just fork directly, if this is web then we redirect them to the fork tab

              if (isTauri) {
                setLoading(true);

                try {
                  if (isTauri) {
                    setRecipeFork(`${selectedRecipe.id}::${template.title}`);
                    setDesktopPage({
                      page: DesktopPage.Editor,
                    });
                  }
                } catch (e) {}
                setLoading(false);
              } else {
                setShowForkModal(true);
              }
            }}
          >
            Fork
            {loading && (
              <span className="loading loading-bars loading-sm"></span>
            )}
          </button>
        </div>
      </div>
      {showForkModal && (
        <RecipeForkTab
          onClose={() => {
            setShowForkModal(false);
          }}
          template={template}
        />
      )}
    </>
  );
}

function ShareRecipeButton({ template }: { template: UserTemplatePreview }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className=""
        onClick={() => {
          setShowModal(true);
        }}
      >
        SHARE
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

function ShareModal({
  template,
  onClose,
}: {
  template: UserTemplatePreview;
  onClose: () => void;
}) {
  const [onAction, setOnAction] = useState(false);
  const posthog = usePostHog();
  const isTauri = useIsTauri();
  const project = useContext(RecipeProjectContext);
  const clipboard = useClipboard();

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
          <TemplateMockCode template={template} />

          <button
            className="btn btn-accent w-full mt-4"
            onClick={async () => {
              await clipboard.writeText(
                `${isTauri ? "https://recipeui.com" : location.origin}/r/${
                  template.alias
                }`
              );

              posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
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

// export function ShareInviteModal({
//   template,
//   onClose,
// }: {
//   template: UserTemplatePreview;
//   onClose: () => void;
// }) {
//   const [isForking, setIsForking] = useState(false);
//   const posthog = usePostHog();
//   const user = useRecipeSessionStore((state) => state.user);

//   const [newTemplateId, setNewTemplateId] = useState<string | null>(null);
//   const [limitedForks, setLimitedForks] = useState(false);

//   const [_, setForkedTemplate] = useLocalStorage<UserTemplatePreview | null>(
//     UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
//     null
//   );

//   const isCurrentUserTemplate = template.author_id === user?.user_id;
//   const isTauri = useIsTauri();
//   const supabase = useSupabaseClient();

//   const isTeam = template.project_scope === ProjectScope.Team;

//   const isQuickUse = isCurrentUserTemplate || isTeam;

//   return (
//     <Dialog open={true} onClose={onClose} className="relative z-20">
//       <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

//       <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
//         <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
//           <TemplateMockCode template={template} isTeam />
//           {newTemplateId === null ? (
//             <>
//               {isCurrentUserTemplate && (
//                 <button
//                   className="btn btn-accent w-full mt-4"
//                   onClick={async () => {
//                     await navigator.clipboard.writeText(
//                       `${
//                         isTauri ? "https://recipeui.com" : location.origin
//                       }/r/${template.alias}`
//                     );

//                     alert("Copied to clipboard");
//                   }}
//                 >
//                   Share
//                 </button>
//               )}
//               <button
//                 className="btn btn-accent w-full mt-4"
//                 onClick={async (e) => {
//                   if (isQuickUse) {
//                     setNewTemplateId(template.id);
//                     return;
//                   }

//                   if (!user) {
//                     posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
//                       template_id: template.id,
//                       template_project: template.recipe.project,
//                       recipe_title: template.recipe.title,
//                     });

//                     setForkedTemplate(template);
//                     setNewTemplateId(template.id);
//                   } else {
//                     setIsForking(true);
//                     const { newTemplate, error } = await cloneTemplate(
//                       template.id,
//                       supabase
//                     );

//                     if (newTemplate) {
//                       posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_FORKED, {
//                         new_template_id: newTemplate.id,
//                         old_template_id: template.id,
//                         template_project: template.recipe.project,
//                         recipe_title: template.recipe.title,
//                       });

//                       setNewTemplateId(newTemplate.id);
//                     } else if (
//                       error === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED
//                     ) {
//                       setLimitedForks(true);
//                     }
//                     setIsForking(false);
//                   }
//                 }}
//               >
//                 {isQuickUse ? "Use template" : "Fork this Recipe!"}
//                 {isForking && <span className="loading loading-bars" />}
//               </button>
//             </>
//           ) : null}

//           {limitedForks && (
//             <div className="alert alert-error !mt-4 flex flex-col items-start">
//               <p>{`We love that you're making so many recipes but we're currently limiting users to 10 recipes right now to scale properly. Please delete some recipes and try again.`}</p>
//               <p>Want to be an early RecipeUI power user?</p>
//               <a
//                 href={FORM_LINKS.RECIPEUI_PRO}
//                 target="_blank"
//                 className="underline underline-offset-2 -mt-4"
//               >
//                 Sign up here.
//               </a>
//             </div>
//           )}
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// }

export function TemplateMockCode({
  template,
  isTeam: _isTeam,
}: {
  template: UserTemplatePreview;
  isTeam?: boolean;
}) {
  const project = useContext(RecipeProjectContext);
  const isTeam = _isTeam || project?.scope === ProjectScope.Team;

  const label = isTeam
    ? `${project ? project.title : "Team"} | ${template.recipe.title}`
    : `${template.recipe.project} | ${template.recipe.title}`;

  return (
    <div className="mockup-code h-full w-full">
      <pre className="px-4 py-2 whitespace-pre-wrap">
        <p className="text-xs font-bold">{label}</p>
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
