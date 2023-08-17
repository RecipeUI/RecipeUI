"use client";
import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "types/enums";
import { Loading } from "ui/components/Loading";
import { fetchHome } from "ui/fetchers/home";

export default function Home({
  searchParams,
}: {
  searchParams: {
    sessionId?: string;
    recipeId?: string;
  };
}) {
  const { sessionId, recipeId } = searchParams;

  useEffect(() => {
    if (recipeId == null && sessionId) {
      redirect("/");
    }
  }, [recipeId, sessionId]);

  const supabase = createClientComponentClient<Database>();

  const { data: projectRes, isLoading } = useQuery({
    queryKey: [QueryKey.Projects, QueryKey.Recipes, searchParams, supabase],
    queryFn: async () =>
      fetchHome({
        searchParams,
        supabase,
      }),
  });

  useEffect(() => {
    if (recipeId && !projectRes?.recipe && !isLoading) {
      redirect("/");
    }
  }, [isLoading, projectRes?.recipe, recipeId]);

  if (isLoading) {
    return <Loading />;
  }

  if (!projectRes) {
    return <div className="p-4">App seems to be down</div>;
  }

  const { globalProjects, userProjects, recipe } = projectRes;

  return (
    <RecipeHomeContainer
      globalProjects={globalProjects}
      projects={userProjects}
      recipe={recipe || undefined}
      sessionId={sessionId}
    />
  );
}
