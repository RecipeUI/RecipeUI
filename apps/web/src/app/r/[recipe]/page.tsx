import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database, RecipeProject, UserTemplatePreview } from "types/database";
import { getProjectSplit } from "ui/utils/main";

export const dynamic = "force-dynamic";

export default async function RecipePage({
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

  const projectRes = await supabase.from("project").select();
  const { userProjects } = getProjectSplit(
    (projectRes.data || []) as RecipeProject[]
  );

  let sharedTemplateInfo: null | UserTemplatePreview = null;
  if (recipeName) {
    const { data: templateData } = await supabase
      .from("template_view")
      .select(
        "id, created_at, title, description, original_author, recipe, visibility, alias, author_id, project_scope"
      )
      .eq("alias", recipeName);

    if (templateData && templateData.length > 0) {
      sharedTemplateInfo = templateData[0] as UserTemplatePreview;
    }
  }

  return (
    <RecipeHomeContainer
      projects={userProjects}
      sharedTemplate={sharedTemplateInfo || undefined}
    />
  );
}
