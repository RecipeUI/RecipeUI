"use client";
import { useRecipeSessionStore } from "../../../state/recipeSession";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  API_TYPE_NAMES,
  ONBOARDING_CONSTANTS,
} from "../../../utils/constants/main";
import { useInitializeRecipe } from "../../../hooks/useInitializeRecipe";
import { RECIPE_IDS } from "../../../utils/constants/recipe";

// ONBOARDING_CONSTANTS
export function EditorQueryOnboarding() {
  const [_, setOnboarded] = useLocalStorage(
    ONBOARDING_CONSTANTS.QUERY_ONBOARDING,
    false
  );

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const { initializeRecipe } = useInitializeRecipe();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4 text-sm overflow-y-auto flex-1">
      <h2 className="font-bold text-lg">[Tutorial] Query Params</h2>
      <p className="text">The query below</p>
      <code className="code-snippet-onboarding">?subreddit=cats&sort=top</code>

      <p>Is represented in RecipeUI as a key-value object</p>
      <code className="code-snippet-onboarding">
        {JSON.stringify(
          {
            subreddit: "cats",
            sort: "top",
          },
          null,
          2
        )}
      </code>

      <p>
        <span className="font-bold">
          You can also add TypeScript to guarantee your query params are always
          correct.
        </span>
      </p>
      <pre>
        <code className="code-snippet-onboarding">{codingExample}</code>
      </pre>
      <p>This enables autocomplete and checking for required params.</p>

      <div className="flex space-x-2">
        <button
          className="btn btn-sm mt-2 w-fit btn-outline"
          disabled={loading}
          onClick={() => {
            setOnboarded(true);
          }}
        >
          DISMISS
        </button>
        {currentSession?.recipeId !== RECIPE_IDS.REDDIT_SEARCH && (
          <button
            className="btn btn-sm mt-2 w-fit btn-neutral"
            disabled={loading}
            onClick={() => {
              initializeRecipe(RECIPE_IDS.REDDIT_SEARCH).catch(() => {
                alert(
                  "Failed to initialize example. Sorry, explore on your own for now."
                );
              });
              setOnboarded(true);
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
  subreddit: string; // Required
  sort?: "top" | "hot" | "new"; // Optional enum
}
`.trim();
