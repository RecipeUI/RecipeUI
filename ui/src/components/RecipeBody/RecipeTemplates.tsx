import { startTransition, useContext } from "react";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeMutationCore } from "@/types/databaseExtended";
import { getTemplate } from "@/components/RecipeBody/actions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import classNames from "classnames";
import { deleteTemplate } from "@/components/RecipeBody/RecipeBodySearch/actions";
import { revalidatePath } from "next/cache";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "@/utils/posthogConstants";

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

        <div>
          <h1 className="text-xl font-bold">Starter Recipes</h1>
          <p className="mt-2">
            Use some of these recipes below to quickly prefill the editor. You
            can also create your own later!
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
              key={`${template.title}`}
            >
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
                <button
                  className="btn btn-xs btn-neutral w-fit"
                  data-tooltip="Coming soon link"
                  onClick={() => {
                    // if (template.requestBody) {
                    //   setRequestBody(template.requestBody);
                    // }
                    // if (template.queryParams) {
                    //   setQueryParams(template.queryParams);
                    // }
                    // if (template.urlParams) {
                    //   setUrlParams(template.urlParams);
                    // }
                    // setBodyRoute(RecipeBodyRoute.Parameters);

                    posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
                      template_id: template.id,
                      template_project: selectedRecipe.project,
                      recipe_id: selectedRecipe.id,
                      recipe_path: selectedRecipe.path,
                    });
                  }}
                >
                  Share
                </button>
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
