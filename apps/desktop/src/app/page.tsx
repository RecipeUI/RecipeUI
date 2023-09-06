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
  RecipeNativeFetchContext,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "ui/state/recipeSession";
import { RecipeBodySearch } from "ui/components/RecipeBody/RecipeBodySearch";
import { RecipeBody } from "ui/components/RecipeBody";
import { RecipeHome } from "ui/components/RecipeHome/RecipeHome";
import { RecipeAPI } from "ui/components/RecipeAPI";
import classNames from "classnames";
import { InvokeArgs, invoke } from "@tauri-apps/api/tauri";
import EditorPage from "ui/pages/editor/EditorPage";

export default function Page() {
  const invokeMemoized = useMemo(() => {
    return (payload: FetchRequest) =>
      invoke<FetchResponse>("fetch_wrapper", payload as unknown as InvokeArgs);
  }, []);

  useEffect(() => {
    initializeDB();
  }, []);

  return (
    <RecipeNativeFetchContext.Provider value={invokeMemoized}>
      <Navbar />
      <Container />
    </RecipeNativeFetchContext.Provider>
  );
}

function Container() {
  const desktopPage = useRecipeSessionStore((state) => state.desktopPage);

  if (!desktopPage) {
    return <HomePage />;
  }

  if (desktopPage.page === DesktopPage.Project) {
    return <ProjectPage project={desktopPage.pageParam} />;
  }
  if (desktopPage.page === DesktopPage.RecipeView) {
    return <RecipePage api_id={desktopPage.pageParam} />;
  }

  if (desktopPage.page === DesktopPage.Editor) {
    return <EditorPage />;
  }

  return <div className="p-4">404</div>;
}

function HomePage() {
  const supabase = useSupabaseClient();
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const { data: projectData, isLoading: isLoadingHome } = useQuery({
    queryKey: [QueryKey.Projects],
    queryFn: async () =>
      supabase.from("project").select().neq("visibility", "unlisted"),
  });

  const { globalProjects, userProjects } = getProjectSplit(
    (projectData?.data || []) as RecipeProject[]
  );

  const { data: recipe, isLoading: isLoadingRecipe } = useQuery({
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

  const project = useMemo(() => {
    return recipe
      ? userProjects.find((p) => p.project === recipe.project) ||
          globalProjects.find((p) => p.project === recipe.project)
      : null;
  }, [globalProjects, userProjects, recipe]);

  if (isLoadingHome || isLoadingRecipe) {
    return <Loading />;
  }

  return (
    <div
      className={classNames(
        "flex-1 flex flex-col",
        "p-4 sm:px-6 sm:pb-6 sm:pt-4"
      )}
    >
      <RecipeContext.Provider value={recipe || null}>
        <RecipeProjectContext.Provider value={project || null}>
          <RecipeHome globalProjects={globalProjects} projects={userProjects} />
        </RecipeProjectContext.Provider>
      </RecipeContext.Provider>
    </div>
  );
}

import { fetchProject, fetchProjectPage } from "ui/fetchers/project";
import { ProjectContainer } from "ui/components/Project/ProjectContainer";
import { RecipeHomeHero } from "ui/components/RecipeHome/RecipeHomeHero";
import { useSupabaseClient } from "ui/components/Providers/SupabaseProvider";
import { initializeDB } from "ui/state/apiSession";
import { Navbar } from "ui/components/Navbar/Navbar";

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

function RecipePage({ api_id }: { api_id: string }) {
  const supabase = useSupabaseClient();

  const { data, isLoading } = useQuery({
    queryKey: [QueryKey.RecipesView, api_id, supabase],
    queryFn: async () => {
      const recipe = await fetchHomeRecipe({
        supabase,
        recipeId: api_id,
      });

      const project = recipe
        ? await fetchProject({
            project: recipe.project,
            supabase,
          })
        : null;

      return {
        recipe,
        project,
      };
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <div>App 404</div>;
  }

  return <RecipeAPI project={data.project} recipe={data.recipe} />;
}
