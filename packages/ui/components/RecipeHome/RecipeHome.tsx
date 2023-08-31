import classNames from "classnames";
import { ReactNode, useMemo } from "react";
import { RecipeProject } from "types/database";
import { RecipeProjectStatus } from "types/enums";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../utils/constants/posthog";
import { useRouter } from "next/navigation";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { useIsTauri } from "../../hooks/useIsTauri";

export function RecipeHome({
  globalProjects,
  projects,
}: {
  globalProjects: RecipeProject[];
  projects: RecipeProject[];
}) {
  const { popular, free, ycombinator, more } = useMemo(() => {
    const popular: RecipeProject[] = [];
    const free: RecipeProject[] = [];
    const ycombinator: RecipeProject[] = [];
    const more: RecipeProject[] = [];

    globalProjects.forEach((recipe) => {
      const tags = recipe.tags || [];

      if (tags.includes("Popular")) {
        popular.push(recipe);
      } else if (tags.includes("Free")) {
        free.push(recipe);
      } else if (tags.includes("YCombinator")) {
        ycombinator.push(recipe);
      } else {
        more.push(recipe);
      }
    });

    return {
      popular,
      free,
      ycombinator,
      more,
    };
  }, [globalProjects]);

  return (
    <div className="sm:mt-0 flex-1 flex flex-col sm:p-4 space-y-12">
      {/* {projects.length > 0 && (
        <MarketplaceSection header="Your Projects" projects={projects} />
      )} */}
      <MarketplaceSection
        header="Popular APIs"
        description={
          <p>{"Discover people's recipes for building with popular APIs. "}</p>
        }
        projects={popular}
      />
      <MarketplaceSection
        header="No Auth"
        description="API key not required -> these APIs can be run right away!"
        projects={free}
      />
      {/* <MarketplaceSection
        header="YCombinator"
        description="We are part of YC S23! The first few recipes were ones we built internally at Robinhood and Meta to save our coworkers time. Check out these API's from our YC family."
        projects={ycombinator}
      /> */}
      {more.length > 0 && (
        <MarketplaceSection
          header="Discover"
          description="Checkout these APIs and let us know what you think!"
          projects={more}
        />
      )}
    </div>
  );
}

function MarketplaceSection({
  header,
  description,
  projects,
}: {
  header: string;
  description?: string | ReactNode;
  projects: RecipeProject[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold dark:text-gray-100">{header}</h1>
      {description ? (
        typeof description === "string" ? (
          <p>{description}</p>
        ) : (
          description
        )
      ) : null}
      <div className="projects-home-container">
        {projects.map((recipe) => {
          return (
            <RecipeHomeBox
              key={recipe.title}
              project={recipe.project}
              title={recipe.title}
              subheader={recipe.subheader}
              description={recipe.description}
              status={recipe.status}
              image={recipe.image}
            />
          );
        })}
      </div>
    </div>
  );
}

export function RecipeHomeBox({
  title,
  subheader,
  project,
  description,
  status: _status,
  image,
}: {
  title: string;
  project: string;
  subheader?: string | null;
  description: string;
  status: RecipeProjectStatus;
  image?: string | null;
}) {
  let status = String(_status);
  const postHog = usePostHog();

  if (_status === RecipeProjectStatus.Active) {
    status = "View";
  }

  const router = useRouter();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  return (
    <div
      className="border border-slate-700 rounded-md p-4 space-y-1 cursor-pointer h-full recipe-container-box"
      onClick={() => {
        postHog.capture(POST_HOG_CONSTANTS.PROJECT_LOAD, {
          project,
        });

        if (isTauri) {
          setDesktopPage({
            page: DesktopPage.Project,
            pageParam: project,
          });
        } else {
          router.push(`/${project}`);
        }
      }}
    >
      <div className="flex justify-between">
        <div className="flex items-center">
          {image && <img className="w-6 h-6 mr-2 object-cover" src={image} />}
          <h2 className="font-bold text-lg dark:text-gray-300">{title}</h2>
        </div>

        <div
          className="tooltip"
          data-tip={
            status === RecipeProjectStatus.Soon ? "Stay tuned!" : undefined
          }
        >
          <button
            className={classNames(
              "btn btn-outline btn-sm",
              status === RecipeProjectStatus.Soon && "!btn-outline"
            )}
          >
            {status}
          </button>
        </div>
      </div>
      {subheader && (
        <h3 className="font-bold text-sm dark:text-gray-300">{subheader}</h3>
      )}
      <p className="text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}
