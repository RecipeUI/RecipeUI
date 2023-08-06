import classNames from "classnames";
import { ReactNode, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/utils/constants";
import { RecipeProject, RecipeProjectStatus } from "@/types/database_extended";
import { DeepActionType, useRecipeSessionStore } from "@/state/recipeSession";

export function RecipeHome() {
  const supabase = createClientComponentClient<Database>();

  const projectsQuery = useQuery({
    queryKey: [QueryKeys.Projects],
    queryFn: async () => {
      const { data } = await supabase.from("project").select();
      return (data || []) as RecipeProject[];
    },
  });

  const { popular, free, ycombinator, more } = useMemo(() => {
    const projects = projectsQuery.data || [];

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
      }
    });

    return {
      popular,
      free,
      ycombinator,
      more,
    };
  }, [projectsQuery.data]);

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
      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4 gap-4">
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

function RecipeHomeBox({
  title,
  subheader,
  project,
  description,
  status,
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
  return (
    <div className="border rounded-md shadow-sm p-4 space-y-1">
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
            onClick={() => {
              addDeepAction({
                type: DeepActionType.UpdateRecipeInput,
                payload: project,
              });
            }}
          >
            {status}
          </button>
        </div>
      </div>
      <h3 className="font-bold text-sm dark:text-gray-300">
        {subheader ?? "Testing"}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-3 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
}
