"use client";
import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";
import { Database, RecipeProject } from "types/database";
import { redirect } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "types/enums";
import { Loading } from "ui/components/Loading";
import { fetchHome, fetchHomeRecipe } from "ui/fetchers/home";
import { getProjectSplit } from "ui/utils/main";
import {
  DesktopPage,
  FetchRequest,
  FetchResponse,
  RecipeContext,
  RecipeNativeFetch,
  useRecipeSessionStore,
} from "ui/state/recipeSession";
import { RecipeBodySearch } from "ui/components/RecipeBody/RecipeBodySearch";
import { RecipeBody } from "ui/components/RecipeBody";
import { RecipeHome } from "ui/components/RecipeHome/RecipeHome";
import classNames from "classnames";
import { InvokeArgs, invoke } from "@tauri-apps/api/tauri";
import NewPage from "ui/pages/new";

export default function Container() {
  const desktopPage = useRecipeSessionStore((state) => state.desktopPage);

  if (!desktopPage) {
    return <HomePage />;
  }
  if (desktopPage.page === DesktopPage.Project) {
    return <ProjectPage project={desktopPage.pageParam} />;
  }
  if (desktopPage.page === DesktopPage.New) {
    return <NewPage />;
  }
  return <HomePage />;
}

function HomePage() {
  const supabase = useSupabaseClient();
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const { data: projectData, isLoading: isLoadingHome } = useQuery({
    queryKey: [QueryKey.Projects],
    queryFn: async () => supabase.from("project").select(),
  });

  const { globalProjects, userProjects } = getProjectSplit(
    (projectData?.data || []) as RecipeProject[]
  );

  const {
    data: recipe,
    isLoading: isLoadingRecipe,
    refetch,
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [QueryKey.RecipesHomeView, currentSession?.recipeId],
    queryFn: async () => {
      return currentSession?.recipeId
        ? fetchHomeRecipe({
            supabase,
            recipeId: currentSession?.recipeId!,
          })
        : null;
    },
  });

  const invokeMemoized = useMemo(() => {
    return (payload: FetchRequest) =>
      invoke<FetchResponse>("fetch_wrapper", payload as unknown as InvokeArgs);
  }, []);

  if (isLoadingHome || isLoadingRecipe) {
    return <Loading />;
  }

  const hasSession = currentSession != null && recipe;
  return (
    <div
      className={classNames(
        "flex-1 flex flex-col",
        currentSession == null && "p-4 sm:px-6 sm:pb-6 sm:pt-4"
      )}
    >
      <RecipeContext.Provider value={recipe || null}>
        <RecipeNativeFetch.Provider value={invokeMemoized}>
          {!hasSession && <RecipeHomeHero />}
          <RecipeBodySearch />
          {hasSession ? (
            <RecipeBody />
          ) : (
            <RecipeHome
              globalProjects={globalProjects}
              projects={userProjects}
            />
          )}
        </RecipeNativeFetch.Provider>
      </RecipeContext.Provider>
    </div>
  );
}

import { fetchProjectPage } from "ui/fetchers/project";
import { ProjectContainer } from "ui/components/Project/ProjectContainer";
import { RecipeHomeHero } from "ui/components/RecipeHome/RecipeHomeHero";
import { useSupabaseClient } from "ui/components/Providers/SupabaseProvider";

function ProjectPage({ project: projectParam }: { project: string }) {
  const supabase = useSupabaseClient();

  const { data: projectData, isLoading } = useQuery({
    queryKey: [QueryKey.Projects, projectParam, supabase],
    queryFn: async () =>
      fetchProjectPage({
        project: projectParam,
        supabase,
      }),
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!projectData) {
    return <div>App 404</div>;
  }

  const { project, projectName, recipes } = projectData;

  return (
    <ProjectContainer
      projectName={projectName}
      project={project}
      recipes={recipes}
    />
  );
}
