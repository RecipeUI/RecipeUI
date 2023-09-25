import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { fetchHomeRecipe } from "ui/fetchers/home";
import { RecipeAPI } from "ui/components/RecipeAPI";
import { fetchProject } from "ui/fetchers/project";

export const dynamic = "force-dynamic";

export default async function APIPage({
  params,
}: {
  params: {
    api_id: string;
  };
}) {
  const api_id = decodeURIComponent(params.api_id);

  try {
    const supabase = createServerComponentClient<Database>({
      cookies,
    });

    const recipe = await fetchHomeRecipe({
      recipeId: api_id,
      supabase,
    });

    const project = recipe
      ? await fetchProject({
          project: recipe.project,
          supabase,
        })
      : null;

    return <RecipeAPI project={project} recipe={recipe} apiId={api_id} />;
  } catch (e) {
    return <RecipeAPI project={null} recipe={null} apiId={api_id} />;
  }
}
