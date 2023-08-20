"use client";

import Link from "next/link";
import { isTauri } from "../../utils/main";
import { useRouter } from "next/navigation";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";

export function RecipeHomeHero() {
  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  return (
    <div className="sm:block sm:m-4 bg-yellow-200 dark:bg-yellow-200/80 p-6 sm:p-8 rounded-md mb-4 dark:text-black">
      <h1 className="font-bold text-xl">Test APIs in seconds</h1>
      <p className="mt-2 sm:text-base">
        {
          "Use the APIs below immediately, no coding experience required. See how we're making APIs easier for teams and developers of all backgrounds."
        }
      </p>
      <div className="mt-4 flex-col sm:flex-row gap-2 hidden sm:flex">
        <button
          className="btn btn-neutral w-fit"
          onClick={() => {
            if (isTauri()) {
              setDesktopPage({
                page: DesktopPage.Project,
                pageParam: "OpenAI",
              });
            } else {
              router.push("/OpenAI");
            }
          }}
        >
          Try OpenAI
        </button>
        {!isTauri() && (
          <button
            className="btn btn-neutral hidden sm:block"
            onClick={() => {
              window.open(
                "https://github.com/RecipeUI/RecipeUI/releases",
                "_blank"
              );
            }}
          >
            Download Desktop
          </button>
        )}
      </div>
    </div>
  );
}
