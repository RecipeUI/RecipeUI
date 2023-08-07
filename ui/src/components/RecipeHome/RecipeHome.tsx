import classNames from "classnames";
import { ReactNode, useMemo } from "react";
import { RecipeProject, RecipeProjectStatus } from "@/types/databaseExtended";
import { DeepActionType, useRecipeSessionStore } from "@/state/recipeSession";
import Link from "next/link";

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
    <div className="flex-1 flex flex-col p-4 space-y-12">
      <MarketplaceSection
        header="Popular"
        description="Discover popular recipes built from the community! More recipes will come everyday."
        projects={popular}
      />
      <MarketplaceSection
        header="Free"
        description="These APIs don't require any authentication! Use these in seconds..."
        projects={free}
      />
      <MarketplaceSection
        header="YCombinator"
        description="We joined YCombinator because we built recipes internally at Robinhood and Facebook. Checkout these APIs from the YC community!"
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
  const addDeepAction = useRecipeSessionStore((state) => state.addDeepAction);

  let status = String(_status);

  if (_status === RecipeProjectStatus.Active) {
    status = "View";
  }

  return (
    <div className="border rounded-md shadow-sm p-4 space-y-1">
      <div className="flex justify-between ">
        <div className="flex items-center">
          {image && <img className="w-6 h-6 mr-2 object-cover" src={image} />}
          <h2 className="font-bold text-xl dark:text-gray-300">{title}</h2>
        </div>
        <Link href={`/${project}`}>
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
        </Link>
      </div>
      <h3 className="font-bold text-sm dark:text-gray-300">{subheader}</h3>
      <p className="text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}
