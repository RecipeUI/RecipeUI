"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ProjectContainer } from "ui/components/Project/ProjectContainer";

import { fetchProjectPage } from "ui/fetchers/project";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "types/enums";
import { Loading } from "ui/components/Loading";

export default function ProjectPage({
  params,
}: {
  params: {
    project: string;
  };
}) {
  const supabase = createClientComponentClient();

  const { data, isLoading } = useQuery({
    queryKey: [QueryKey.Projects, QueryKey.RecipesView, params, supabase],
    queryFn: async () => fetchProjectPage({ params, supabase }),
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <div className="p-4">App seems to be down</div>;
  }

  const { project, projectName, recipes } = data;

  return (
    <ProjectContainer
      projectName={projectName}
      project={project}
      recipes={recipes}
    />
  );
}
