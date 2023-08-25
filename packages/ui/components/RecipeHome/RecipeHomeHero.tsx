"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { useIsTauri } from "../../hooks/useIsTauri";

export function RecipeHomeHero() {
  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  return (
    <div className="sm:block sm:m-4 bg-yellow-200 dark:bg-yellow-200/80 p-6 sm:p-8 rounded-md mb-4 dark:text-black">
      <h1 className="font-bold text-xl">API Playground</h1>
      <p className="mt-2 sm:text-base">
        {
          "Run the APIs below immediately, no coding experience or auth required. See how we're making APIs easier for teams and developers of all backgrounds."
        }
      </p>
      <div className="mt-4 flex-col sm:flex-row gap-2 hidden sm:flex">
        <button
          className="btn btn-neutral w-fit"
          onClick={() => {
            if (isTauri) {
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
        {/* {!isTauri && (
          <Link className="btn btn-neutral" href="/download">
            Download Desktop
          </Link>
        )} */}
      </div>
    </div>
  );
}
