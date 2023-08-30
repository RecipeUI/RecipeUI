import { RecipeHomeContainer } from "ui/components/RecipeHome/RecipeHomeContainer";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { redirect } from "next/navigation";
import { fetchHome } from "ui/fetchers/home";
import { APP_COOKIE } from "ui/utils/constants/main";

export const dynamic = "force-dynamic";

export default async function Home({
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

  const cookieStore = cookies();

  if (Object.keys(searchParams).length === 0) {
    const showApp = cookieStore.get(APP_COOKIE)?.value !== undefined;
    if (!showApp && process.env.NEXT_PUBLIC_ENV !== "dev") {
      // redirect("https://home.recipeui.com/");
    }
  }

  const { globalProjects, userProjects, recipe } = await fetchHome({
    searchParams,
    supabase,
  });

  return (
    <RecipeHomeContainer
      globalProjects={globalProjects}
      projects={userProjects}
      recipe={recipe || undefined}
    />
  );
}
