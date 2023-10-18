"use client";
import { useRecipeSessionStore } from "../../../state/recipeSession";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { useInitializeRecipe } from "../../../hooks/useInitializeRecipe";
import { API_TYPE_NAMES, RECIPE_IDS } from "../../../utils/constants/recipe";
import { Modal } from "../../../components/Modal";
import { useNeedsOnboarding } from "../../../state/apiSession/OnboardingAPI";
import { ONBOARDING_CONSTANTS } from "utils/constants";
import classNames from "classnames";

// ONBOARDING_CONSTANTS
export function EditorQueryOnboarding({ className }: { className?: string }) {
  const { turnOffOnboarding } = useNeedsOnboarding(
    ONBOARDING_CONSTANTS.QUERY_ONBOARDING
  );

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const { initializeRecipe } = useInitializeRecipe();
  const [loading, setLoading] = useState(false);

  return (
    <div
      className={classNames(
        "text-sm overflow-y-auto flex-1 space-y-4",
        className
      )}
    >
      <h1 className="font-bold text-xl">
        [Tutorial] Type safety with query params
      </h1>
      <p className="text">The query below</p>
      <code className="code-snippet-onboarding">
        www.someurl.com/
        <span className="badge badge-sm badge-accent m-0 mt-0.5 rounded-md">
          ?q=cats&sort=top
        </span>
      </code>
      <p>Is represented in RecipeUI as a key-value object</p>
      <code className="code-snippet-onboarding">
        {JSON.stringify(
          {
            q: "cats",
            sort: "top",
          },
          null,
          2
        )}
      </code>

      <p>We can decorate this object with TypeScript.</p>
      <pre>
        <code className="code-snippet-onboarding">{codingExample}</code>
      </pre>
      <p>To give us linting, autocomplete (CTRL + Space), and type safety.</p>
      <img
        src="https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/recipeui/tutorial/query2.gif"
        className="w-full rounded-lg border border-4 my-2 "
        alt="Query autocomplete GIF"
      />

      <div className="flex space-x-2">
        <button
          className="btn btn-sm mt-2 w-fit btn-outline"
          disabled={loading}
          onClick={() => {
            turnOffOnboarding();
          }}
        >
          DISMISS
        </button>
        {currentSession?.recipeId !== RECIPE_IDS.REDDIT_SEARCH && (
          <button
            className="btn btn-sm mt-2 w-fit btn-neutral dark:btn-accent"
            disabled={loading}
            onClick={() => {
              initializeRecipe(RECIPE_IDS.REDDIT_SEARCH).catch(() => {
                alert(
                  "Failed to initialize example. Sorry, explore on your own for now."
                );
              });
              turnOffOnboarding();
            }}
          >
            Fork Reddit example
          </button>
        )}
      </div>
    </div>
  );
}
const codingExample = `
type ${API_TYPE_NAMES.APIQueryParams} = {
  q: string; // required
  sort: "top" | "hot" | "new"; // required
}
`.trim();
