import { useContext, useEffect, useState } from "react";
import classNames from "classnames";

import { RecipeAuthType, RecipeMutationContentType } from "types/enums";
import {
  RecipeContext,
  RecipeOutputTab,
  RecipeProjectContext,
  RecipeSession,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { DOC_LINKS } from "../../../utils/docLinks";
import { Database } from "types/database";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import {
  deleteSecret,
  getSecret,
  saveSecret,
  setConfigForSessionStore,
} from "../../../state/apiSession";
import { v4 as uuidv4 } from "uuid";
import { JSONSchema6 } from "json-schema";
import { useSessionStorage } from "usehooks-ts";
import { RECIPE_FORKING_ID } from "../../../utils/constants/main";

export function RecipeForkTab() {
  const selectedRecipe = useContext(RecipeContext)!;
  const user = useRecipeSessionStore((state) => state.user);
  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  const router = useRouter();

  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");

  const [loading, setLoading] = useState(false);
  const onSubmit = async () => {
    if (!selectedRecipe) {
      alert("No recipe selected");
      return;
    }

    try {
      setLoading(true);

      await setConfigForSessionStore({
        recipeId: selectedRecipe.id,
        config: {
          editorAuth: selectedRecipe.auth
            ? {
                type: selectedRecipe.auth,
                docs: selectedRecipe.options?.docs?.auth,
                meta: selectedRecipe.options?.auth?.find(
                  (a) => a.type === selectedRecipe.auth
                )?.payload.name,
              }
            : null,

          editorUrl: selectedRecipe.path,
          editorMethod: selectedRecipe.method,

          editorBodyType: RecipeMutationContentType.JSON,
          editorBodySchemaType: selectedRecipe.requestBodyType,
          editorBodySchemaJSON: selectedRecipe.requestBody as JSONSchema6,

          editorQuerySchemaType: selectedRecipe.queryParamsType,
          editorQuerySchemaJSON: selectedRecipe.queryParams as JSONSchema6,

          editorURLSchemaType: selectedRecipe.urlParamsType,
          editorURLSchemaJSON: selectedRecipe.urlParams as JSONSchema6,

          editorHeader: {
            title: selectedRecipe.title,
            description: selectedRecipe.summary,
          },

          editorURLCode: "",
        },
      });

      setRecipeFork(selectedRecipe.id);

      router.push(`/editor`);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="flex-1 relative px-4 py-6">
      <div className="alert flex flex-col items-start w-full bg-accent dark:bg-base-200">
        <div className="w-full space-y-4 text-start">
          <h1 className="font-bold text-xl">Fork into RecipeUI Editor</h1>
          <p>
            Our API tool is a Postman alternative that is built on Rust and
            provides native{" "}
            <span className="font-bold">
              TypeScript linting for request parameters!
            </span>
          </p>
          <div className="flex space-x-2">
            <button
              className="btn btn-primary btn-sm"
              disabled={loading}
              onClick={onSubmit}
            >
              Fork Web
              {loading && <span className="loading loading-bars"></span>}
            </button>
            <button className="btn btn-primary btn-sm">Download Desktop</button>
          </div>
        </div>
      </div>
    </div>
  );
}
