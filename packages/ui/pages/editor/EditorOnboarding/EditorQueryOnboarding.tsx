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
      <h2 className="font-bold text-lg">
        [Tutorial] Type safety with query params
      </h2>
      <p className="text">The query below</p>
      <code className="code-snippet-onboarding">?subreddit=cats&sort=top</code>

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
      <p>To give us linting, autocomplete, and type safety.</p>
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
            setOnboarded(true);
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
  q: string; // required
  sort: "top" | "hot" | "new"; // required
  type?: "link" | "comment" | "sr" | "user"; // optional
}
`.trim();
