"use client";

import { useContext, useState } from "react";

import { RecipeMutationContentType } from "types/enums";
import {
  DesktopPage,
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { useRouter } from "next/navigation";
import { JSONSchema6 } from "json-schema";
import { useSessionStorage } from "usehooks-ts";
import { RECIPE_FORKING_ID } from "utils/constants";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { Recipe, RecipeTemplate } from "types/database";
import { Modal } from "../../Modal";
import { APISessionConfig } from "../../../state/apiSession";

export function getConfigFromRecipe(selectedRecipe: Recipe) {
  return {
    recipeId: selectedRecipe.id,
    config: {
      editorAuthConfig:
        selectedRecipe.authConfig ||
        // TODO: For backwards compatibility
        (selectedRecipe.options as any)?.auth?.[0] ||
        null,

      editorUrl: selectedRecipe.path,
      editorMethod: selectedRecipe.method,

      editorBodyType: RecipeMutationContentType.JSON,
      editorBodySchemaType: selectedRecipe.requestBodyType || null,
      editorBodySchemaJSON: selectedRecipe.requestBody as JSONSchema6,

      editorQuerySchemaType: selectedRecipe.queryParamsType || null,
      editorQuerySchemaJSON: selectedRecipe.queryParams as JSONSchema6,

      editorURLSchemaType: selectedRecipe.urlParamsType || null,
      editorURLSchemaJSON: selectedRecipe.urlParams as JSONSchema6,

      editorHeader: {
        title: selectedRecipe.title,
        description: selectedRecipe.summary,
      },

      editorProject: selectedRecipe.project,
    } satisfies APISessionConfig,
  };
}

export function RecipeForkTab({
  template,
  onClose,
}: {
  template: RecipeTemplate;

  onClose: () => void;
}) {
  const selectedRecipe = useContext(RecipeContext)!;

  const router = useRouter();

  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");

  const [loading, setLoading] = useState(false);

  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const onSubmit = async () => {
    if (!selectedRecipe) {
      alert("No recipe selected");
      return;
    }

    try {
      setLoading(true);
      setRecipeFork(`${selectedRecipe.id}::${template.title}`);

      if (isTauri) {
        setDesktopPage({
          page: DesktopPage.Editor,
        });
      } else {
        router.push(`/editor`);
      }
    } catch (e) {}
    setLoading(false);
  };

  return (
    <Modal header="Web or Desktop?" onClose={onClose}>
      <div className="flex-1 relative py-4">
        <div className="w-full space-y-4 text-start">
          <p>
            Download our blazingly fast and lightweight (20mb) desktop app built
            in{" "}
            <span className="text-orange-600 font-bold underline underline-offset-2">
              {" "}
              Tauri Rust
            </span>
            .
          </p>
          <div className="flex space-x-4">
            <button
              className="btn btn-accent"
              disabled={loading}
              onClick={onSubmit}
            >
              {isTauri ? "Fork" : "Fork to Web Editor"}
              {loading && <span className="loading loading-bars"></span>}
            </button>
            <button
              className="btn btn-accent"
              onClick={() => {
                router.push("/");
              }}
            >
              Download Desktop
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
