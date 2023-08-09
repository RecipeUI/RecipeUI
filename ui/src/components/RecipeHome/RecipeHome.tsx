import classNames from "classnames";
import { ReactNode, useMemo } from "react";
import { RecipeProject, RecipeProjectStatus } from "@/types/databaseExtended";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "@/utils/posthogConstants";
import { GITHUB_REPO } from "@/utils/constants";

export function RecipeHome({ projects }: { projects: RecipeProject[] }) {
  const { popular, free, ycombinator, more } = useMemo(() => {
    const popular: RecipeProject[] = [];
    const free: RecipeProject[] = [];
    const ycombinator: RecipeProject[] = [];
    const more: RecipeProject[] = [];

    projects.forEach((recipe) => {
      const tags = recipe.tags || [];
      console;

      if (tags.includes("Popular")) {
        popular.push(recipe);
      } else if (tags.includes("Free")) {
        free.push(recipe);
      } else if (tags.includes("YCombinator")) {
        ycombinator.push(recipe);
      } else if (tags.includes("Soon")) {
        more.push(recipe);
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
  }, [projects]);

  return (
    <div className="flex-1 flex flex-col sm:p-4 space-y-12">
      <MarketplaceSection
        header="Popular APIs"
        description={
          <p>
            Discover popular recipes built from popular APIs! We are open
            sourced and need your help to build more recipes.{" "}
            <a
              href={GITHUB_REPO}
              target="_blank"
              className="underline underline-offset-2"
            >
              Star and figure out here.
            </a>
          </p>
        }
        projects={popular}
      />
      <MarketplaceSection
        header="No API key needed"
        description="These APIs have zero auth setup! Use these in seconds..."
        projects={free}
      />
      <MarketplaceSection
        header="YCombinator"
        description="We are part of YC S23! The first few recipes were ones we built internally at Robinhood and Meta to save our coworkers time. Check out these API's from our YC family."
        projects={ycombinator}
      />
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
  description: string | ReactNode;
  projects: RecipeProject[];
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold dark:text-gray-100">{header}</h1>
      {typeof description === "string" ? <p>{description}</p> : description}
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
  subheader: string;
  description: string;
  status: RecipeProjectStatus;
  image?: string | null;
}) {
  let status = String(_status);
  const postHog = usePostHog();

  if (_status === RecipeProjectStatus.Active) {
    status = "View";
  }

  return (
    <Link href={`/${project}`}>
      <div
        className="border border-slate-700 rounded-md shadow-sm p-4 space-y-1 cursor-pointer h-full"
        onClick={() => {
          postHog.capture(POST_HOG_CONSTANTS.PROJECT_LOAD, {
            project,
          });
        }}
      >
        <div className="flex justify-between ">
          <div className="flex items-center">
            {image && <img className="w-6 h-6 mr-2 object-cover" src={image} />}
            <h2 className="font-bold text-xl dark:text-gray-300">{title}</h2>
          </div>

          <div
            className="tooltip"
            data-tip={
              status === RecipeProjectStatus.Soon
                ? "Join the waitlist!"
                : undefined
            }
          >
            <button
              className={classNames(
                "btn btn-neutral btn-sm",
                status === RecipeProjectStatus.Soon && "!btn-accent"
              )}
            >
              {status}
            </button>
          </div>
        </div>
        <h3 className="font-bold text-sm dark:text-gray-300">{subheader}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
          {description}
        </p>
      </div>
    </Link>
  );
}
