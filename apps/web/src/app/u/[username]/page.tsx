import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Database,
  RecipeProject,
  User,
  UserTemplatePreview,
} from "types/database";
import { ProfileContainer } from "ui/components/Profile/ProfileContainer";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: {
    username: string;
  };
}) {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const { data: profileData } = await supabase
    .from("user_view")
    .select()
    .ilike("username", `%${params.username}%`)
    .limit(1)
    .single();

  let userTemplates: UserTemplatePreview[] = [];

  if (profileData) {
    const {
      data: templateRes,
      error,
      statusText,
    } = await supabase
      .from("template_view")
      .select(
        "id, created_at, title, description, original_author, recipe, visibility, alias, author_id"
      )
      .eq("author_id", profileData.user_id);
    userTemplates = (templateRes as UserTemplatePreview[]) || [];
  }

  const projectNames = new Set(
    userTemplates.map((template) => template.recipe.project)
  );
  const { data: projectRes } = await supabase.from("project").select();

  const projects =
    projectRes?.filter((project) => projectNames.has(project.project)) || [];

  return (
    <ProfileContainer
      username={params.username}
      profile={
        (profileData as Pick<
          User,
          "profile_pic" | "first" | "last" | "username"
        >) || null
      }
      templates={userTemplates}
      projects={projects as RecipeProject[]}
    />
  );
}
