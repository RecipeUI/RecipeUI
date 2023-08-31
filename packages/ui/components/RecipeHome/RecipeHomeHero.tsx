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
    <div className="sm:block sm:m-4 bg-yellow-200 dark:bg-yellow-200/80 p-6 sm:p-8 rounded-md  mb-6 sm:mb-4 dark:text-black">
      <h1 className="font-bold text-xl">
        Discover, test, and share APIs in seconds!
      </h1>
      <p className="mt-2 text-sm sm:text-base">
        {
          "Don't know where to start? Try out these Recipes to experiment with some use cases. "
        }
        <span className="md:block">
          Beginner-friendly, no coding experience required!
        </span>
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
        {!isTauri && (
          <Link className="btn btn-neutral" href="/download">
            Download Desktop
          </Link>
        )}
      </div>
    </div>
  );
}
