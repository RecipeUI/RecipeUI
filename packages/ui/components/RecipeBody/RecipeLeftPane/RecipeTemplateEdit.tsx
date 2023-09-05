import {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { useHover, useInterval, useLocalStorage } from "usehooks-ts";
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
import { Modal } from "../../Modal";
import { URLHighlight } from "../../../pages/editor/EditorURL";

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

  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);
  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);
  const setURLCode = useRecipeSessionStore((state) => state.setEditorURLCode);

  const hoverRef = useRef<HTMLButtonElement>(null);
  const isHover = useHover(hoverRef);

  const [action, setAction] = useState<null | "prefill" | "send">(null);
  return (
    <>
      <div
        className={classNames(
          "border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default relative",
          isHover && "z-20"
          // newTemplateId === String(template.id) &&
          //   "!border-accent !border-4 border-dashed "
        )}
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
                  setAction("prefill");
                }}
              >
                PREFILL
              </button>
            </li>
            <li>
              <button
                className=""
                onClick={async () => {
                  if (
                    !(await confirm("Are you sure you want to delete this?"))
                  ) {
                    return;
                  }

                  posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_DELETE);

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
        <div className="flex space-x-1  sm:block sm:space-x-2 relative">
          <button
            className={classNames(
              "btn btn-sm btn-neutral"
              // loadingTemplate && "btn-disabled"
            )}
            ref={hoverRef}
            onClick={async () => {
              setAction("send");
            }}
          >
            Send
          </button>
        </div>
      </div>
      {action && (
        <SendModal
          onClose={() => setAction(null)}
          miniRecipe={miniRecipe}
          action={action}
        />
      )}
    </>
  );
}

function SendModal({
  miniRecipe,
  onClose,
  action,
}: {
  miniRecipe: RecipeTemplateFragment;
  onClose: () => void;
  action: "send" | "prefill" | "quicksend";
}) {
  const posthog = usePostHog();

  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);

  const editorURL = useRecipeSessionStore((state) => state.editorUrl);
  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);
  const setEditorQuery = useRecipeSessionStore((state) => state.setEditorQuery);
  const setURLCode = useRecipeSessionStore((state) => state.setEditorURLCode);

  const editorBody =
    miniRecipe.requestBody && Object.keys(miniRecipe.requestBody).length > 0
      ? JSON.stringify(miniRecipe.requestBody, null, 2)
      : "";

  const editorQuery =
    miniRecipe.queryParams && Object.keys(miniRecipe.queryParams).length > 0
      ? JSON.stringify(miniRecipe.queryParams, null, 2)
      : "";

  const editorURLCode =
    miniRecipe.urlParams && Object.keys(miniRecipe.urlParams).length > 0
      ? JSON.stringify(miniRecipe.urlParams, null, 2)
      : "";

  const setTemplate = async () => {
    setEditorBody(editorBody);
    setEditorQuery(editorQuery);
    setURLCode(editorURLCode);
  };

  const [count, setCount] = useState(10);

  useInterval(
    () => {
      // Your custom logic here
      setCount(count - 1);
    },
    // Delay in milliseconds or null to stop it
    count > 0 ? 1000 : null
  );
  const onSubmit = async () => {
    await setTemplate();

    if (action === "send") {
      posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_QUICK_USE);

      setTimeout(() => {
        document.getElementById(UNIQUE_ELEMENT_IDS.RECIPE_SEARCH)?.click();
      }, 500);
    } else {
      posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW);
    }
    onClose();
  };

  useEffect(() => {
    if (count === 0 || action === "quicksend") {
      onSubmit();
    }
  }, [count]);

  return (
    <Modal header={miniRecipe.title} onClose={onClose}>
      <p>This will configure the editor with the parameters below.</p>
      <div className="space-y-6 my-6">
        {editorBody && (
          <CodeSnippet title="Request Body" codeString={editorBody} />
        )}
        {editorQuery && (
          <CodeSnippet
            title="Query Params"
            codeString={
              "?" +
              new URLSearchParams(
                miniRecipe.queryParams as Record<string, string>
              ).toString()
            }
          />
        )}
        {editorURLCode && (
          <CodeSnippet
            title="URL Params"
            codeString={
              <URLHighlight
                url={editorURL}
                urlState={miniRecipe.urlParams as Record<string, string>}
              />
            }
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4">
        <button
          className="btn btn-outline"
          onClick={() => {
            onClose();
          }}
        >
          Cancel
        </button>
        <button
          className="btn btn-accent"
          tabIndex={1}
          onClick={() => {
            onSubmit();
          }}
        >
          Auto {action} ({count}s)
        </button>
      </div>
      <p className="mt-2 text-sm">Tip: Hit enter to quickly {action}.</p>
    </Modal>
  );
}

function CodeSnippet({
  codeString,
  title,
}: {
  codeString: string | ReactNode;
  title: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="font-bold">{title}</h2>
      <pre>
        <code className="code-snippet-onboarding overflow-x-auto max-h-[200px]">
          {codeString}
        </code>
      </pre>
    </div>
  );
}
