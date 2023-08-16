import { RecipeHomeContainer } from "@/components/RecipeHome/RecipeHomeContainer";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types";
import { RecipeProject, UserTemplatePreview } from "types";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: {
    recipe: string;
  };
}) {
  const recipeName = decodeURIComponent(params.recipe);
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const projectsResponse = await supabase.from("project").select();
  const projects = (projectsResponse.data || []) as RecipeProject[];

  let sharedTemplateInfo: null | UserTemplatePreview = null;
  if (recipeName) {
    const { data: templateData } = await supabase
      .from("template_public_view")
      .select(
        "id, created_at, title, description, original_author, recipe, visibility, alias, author_id"
      )
      .eq("alias", recipeName);

    if (templateData && templateData.length > 0) {
      sharedTemplateInfo = templateData[0] as UserTemplatePreview;
    }
  }

  return (
    <RecipeHomeContainer
      recipeProjects={projects}
      sharedTemplate={sharedTemplateInfo || undefined}
    />
  );
}
