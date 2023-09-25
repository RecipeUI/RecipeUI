import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { fetchHome } from "ui/fetchers/home";

export const dynamic = "force-dynamic";

export default async function Collections({
  searchParams,
}: {
  searchParams: {
    sessionId?: string;
    recipeId?: string;
    test?: string;
  };
}) {
  try {
    const supabase = createServerComponentClient<Database>({
      cookies,
    });

    const { userProjects, recipe } = await fetchHome({
      searchParams,
      supabase,
    });

    return (
      <RecipeHomeContainer
        projects={userProjects}
        recipe={recipe || undefined}
      />
    );
  } catch (e) {
    return <RecipeHomeContainer projects={[]} recipe={undefined} />;
  }
}
