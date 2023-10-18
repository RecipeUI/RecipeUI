"use client";
import { useRecipeSessionStore } from "../../../state/recipeSession";
import { useState } from "react";
import { useInitializeRecipe } from "../../../hooks/useInitializeRecipe";
import { RECIPE_IDS } from "../../../utils/constants/recipe";
import { Modal } from "../../../components/Modal";
import { URLHighlight } from "../EditorURL";
import { useNeedsOnboarding } from "../../../state/apiSession/OnboardingAPI";
import { ONBOARDING_CONSTANTS } from "utils/constants";
import classNames from "classnames";

export function EditorURLOnboarding({ className }: { className?: string }) {
  const { turnOffOnboarding } = useNeedsOnboarding(
    ONBOARDING_CONSTANTS.URL_ONBOARDING
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
        [Tutorial] Type safety with url params
      </h1>
      <p className="mt-2">The URL below makes use of URL params</p>
      <code className="code-snippet-onboarding overflow-x-auto">
        <URLHighlight
          url="https://www.reddit.com/r/{subreddit}/{sort}.json"
          urlState={{
            "{subreddit}": "cats",
            "{sort}": "top",
          }}
        />
      </code>

      <p>We define URL params on RecipeUI as key-value pairs in an object.</p>
      <code className="code-snippet-onboarding">
        {JSON.stringify(
          {
            "{subreddit}": "cats",
            "{sort}": "top",
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
        src="https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/recipeui/tutorial/url.gif"
        className="w-full rounded-lg border border-4 my-2 "
        alt="URL autocomplete GIF"
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
        {currentSession?.recipeId !== RECIPE_IDS.REDDIT_SUBREDDIT && (
          <button
            className="btn btn-sm mt-2 w-fit btn-neutral dark:btn-accent"
            disabled={loading}
            onClick={() => {
              initializeRecipe(RECIPE_IDS.REDDIT_SUBREDDIT).catch(() => {
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
export interface APIUrlParams {
  "{subreddit}": string;
  "{sort}": "hot" | "top" | "new";
}
`.trim();
