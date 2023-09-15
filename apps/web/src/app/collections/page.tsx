import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { redirect } from "next/navigation";
import { fetchHome } from "ui/fetchers/home";
import { APP_COOKIE } from "ui/utils/constants/main";

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
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const { userProjects, recipe } = await fetchHome({
    searchParams,
    supabase,
  });

  return (
    <RecipeHomeContainer projects={userProjects} recipe={recipe || undefined} />
  );
}
