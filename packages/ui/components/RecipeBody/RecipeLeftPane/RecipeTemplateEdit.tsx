import { useCallback, useContext, useState } from "react";
import {
  RecipeBodyRoute,
  RecipeContext,
  RecipeOutputTab,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import {
  RecipeTemplate,
  RecipeTemplateFragment,
  UserTemplatePreview,
} from "types/database";
import { getTemplate } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import classNames from "classnames";

import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";
import {
  DB_FUNC_ERRORS,
  FORM_LINKS,
  UNIQUE_ELEMENT_IDS,
} from "../../../utils/constants/main";
import { useLocalStorage } from "usehooks-ts";
import Link from "next/link";
import { ProjectScope, QueryKey } from "types/enums";
import { cloneTemplate, deleteTemplate } from "../RecipeBodySearch/actions";
import { useQueryClient } from "@tanstack/react-query";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import {
  EllipsisHorizontalCircleIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useMiniRecipes, useSecret } from "../../../state/apiSession";

export function RecipeTemplateEdit() {
  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto space-y-8">
        <UserTemplates />
      </div>
    </div>
  );
}

function UserTemplates() {
  const session = useRecipeSessionStore((state) => state.currentSession);
  const { recipes, deleteRecipe } = useMiniRecipes(session?.recipeId);

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Your Recipes</h1>
      <div className="flex-1 flex flex-col sm:grid grid-cols-2 gap-4 mt-4">
        {recipes.map((miniRecipe) => (
          <UserMiniRecipe
            key={miniRecipe.id}
            miniRecipe={miniRecipe}
            deleteRecipe={deleteRecipe}
          />
        ))}
      </div>
    </div>
  );
}

function UserMiniRecipe({
  miniRecipe,
  deleteRecipe,
}: {
  miniRecipe: RecipeTemplateFragment;
  deleteRecipe: (templateId: string) => Promise<void>;
}) {
  const posthog = usePostHog();

  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);

  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);
  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);
  const setURLCode = useRecipeSessionStore((state) => state.setEditorURLCode);

  const setTemplate = async () => {
    setEditorBody(
      miniRecipe.requestBody ? JSON.stringify(miniRecipe.requestBody) : ""
    );

    if (miniRecipe.queryParams) {
      setEditorQuery(
        miniRecipe.queryParams ? JSON.stringify(miniRecipe.queryParams) : ""
      );
    }

    setURLCode(
      miniRecipe.urlParams ? JSON.stringify(miniRecipe.urlParams) : ""
    );

    setCurrentTab(RecipeOutputTab.DocTwo);
  };

  return (
    <div
      className={classNames(
        "border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default relative"
        // newTemplateId === String(template.id) &&
        //   "!border-accent !border-4 border-dashed "
      )}
      key={`${miniRecipe.id}`}
    >
      <div className="absolute top-2 right-2 mr-1 dropdown dropdown-left  sm:inline-block cursor-pointer">
        <label
          tabIndex={0}
          // className={classNames(loadingTemplate && "btn-disabled")}
        >
          <EllipsisHorizontalIcon className="w-6 h-6" />
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content  menu  shadow rounded-box  mt-1 grid  overflow-auto bg-base-100 text-xs r-0 top-5"
        >
          <li>
            <button
              className=""
              onClick={async () => {
                await setTemplate();

                posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW);

                alert("Recipe copied to editor");
              }}
            >
              PREFILL
            </button>
          </li>
          {/* <li>
            <button
              className={classNames()}
              onClick={async () => {
                posthog.capture(POST_HOG_CONSTANTS.SHARED_TEMPLATE_PREVIEW);

                setLoadingTemplate(miniRecipe);
              }}
            >
              MOCK
            </button>
          </li> */}
          <li>
            <button
              className=""
              onClick={async () => {
                if (!(await confirm("Are you sure you want to delete this?"))) {
                  return;
                }

                posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_DELETE);

                deleteRecipe(miniRecipe.id).then(() => {
                  alert("Recipe deleted");
                  return;
                });
              }}
            >
              DELETE
            </button>
          </li>
        </ul>
      </div>
      <h3 className="font-bold">{miniRecipe.title}</h3>
      <p className="text-sm line-clamp-3">{miniRecipe.description}</p>

      <div className="flex-1" />
      <div className="flex space-x-1  sm:block sm:space-x-2">
        <button
          className={classNames(
            "btn btn-sm btn-neutral"
            // loadingTemplate && "btn-disabled"
          )}
          onClick={async () => {
            await setTemplate();

            posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_QUICK_USE);

            setTimeout(() => {
              document
                .getElementById(UNIQUE_ELEMENT_IDS.RECIPE_SEARCH)
                ?.click();
            }, 500);
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
