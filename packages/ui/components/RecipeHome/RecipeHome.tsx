import classNames from "classnames";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { RecipeProject } from "types/database";
import { RecipeProjectStatus } from "types/enums";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../utils/constants/posthog";
import { DesktopPage, useRecipeSessionStore } from "../../state/recipeSession";
import { useIsTauri } from "../../hooks/useIsTauri";
import { open } from "@tauri-apps/api/shell";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { RecipeUICollectionsAPI } from "../../state/apiSession/RecipeUICollectionsAPI";

export function RecipeHome({ projects }: { projects: RecipeProject[] }) {
  const [localProjects, setLocalProjects] = useState<RecipeProject[]>([]);
  useEffect(() => {
    async function initializeProjects() {
      const mainCollections = await RecipeUICollectionsAPI.getStore();
      setLocalProjects(mainCollections.collections);
    }

    initializeProjects();
  }, []);

  const { popular, free, ycombinator, more } = useMemo(() => {
    const popular: RecipeProject[] = [];
    const free: RecipeProject[] = [];
    const ycombinator: RecipeProject[] = [];
    const more: RecipeProject[] = [];

    localProjects.forEach((project) => {
      const tags = project.tags || [];

      if (tags.includes("Popular")) {
        popular.push(project);
      } else if (tags.includes("Free")) {
        free.push(project);
      } else {
        more.push(project);
      }
    });

    return {
      popular,
      free,
      ycombinator,
      more,
    };
  }, [localProjects]);

  const isTauri = useIsTauri();
  const user = useRecipeSessionStore((state) => state.user);

  return (
    <div className="sm:mt-0 flex-1 flex flex-col sm:p-4 space-y-12">
      {projects.length > 0 && user && (
        <MarketplaceSection
          id="personal"
          header="Personal Collections"
          description={<p>{`${user.username}'s personal collections.`}</p>}
          preferId
          projects={projects}
        />
      )}
      <MarketplaceSection
        id="popular"
        header="Popular APIs"
        description={
          <p>{"Discover people's recipes for building with popular APIs. "}</p>
        }
        projects={popular}
      />
      <div className="alert w-fit">
        <SparklesIcon className="w-6" />
        <span>Suggest us APIs to support!</span>
        <div>
          <Link
            className="btn btn-sm btn-outline"
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLSfsj0O2OI8lZOs4uX3RB7yINoqR81nhIYom2wHIK3d4Ggwy4Q/viewform"
            onClick={(e) => {
              if (isTauri) {
                e.preventDefault();
                open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSfsj0O2OI8lZOs4uX3RB7yINoqR81nhIYom2wHIK3d4Ggwy4Q/viewform"
                );
              }
            }}
          >
            Suggest
          </Link>
        </div>
      </div>
      <MarketplaceSection
        header="No Auth"
        description="API key not required -> these APIs can be run right away!"
        projects={free}
      />
      {more.length > 0 && (
        <MarketplaceSection
          header="Community"
          description="Checkout these publicly contributed API collections!"
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
  preferId = false,
  id,
}: {
  header: string;
  description?: string | ReactNode;
  projects: RecipeProject[];
  preferId?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-16 sm:scroll-m-0">
      <h1 className="text-2xl font-bold dark:text-gray-100">{header}</h1>
      {description ? (
        typeof description === "string" ? (
          <p>{description}</p>
        ) : (
          description
        )
      ) : null}
      <div className="projects-home-container">
        {projects.map((project) => {
          return (
            <RecipeHomeBox
              key={project.title}
              project={preferId ? project.id : project.project}
              title={project.title}
              subheader={project.subheader}
              description={project.description}
              status={project.status}
              image={project.image}
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

  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const isTauri = useIsTauri();

  return (
    <Link
      href={`/${project}`}
      className="border border-slate-700 rounded-md p-4 space-y-1 cursor-pointer h-full recipe-container-box"
      onClick={(e) => {
        if (isTauri) {
          e.preventDefault();

          setDesktopPage({
            page: DesktopPage.Project,
            pageParam: project,
          });

          postHog?.capture(POST_HOG_CONSTANTS.PROJECT_LOAD, {
            project,
          });
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
    </Link>
  );
}
