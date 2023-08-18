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
  ...props
}: {
  searchParams: {
    sessionId?: string;
    recipeId?: string;
  };
}) {
  const { sessionId, recipeId } = searchParams;

  if (recipeId == null && sessionId) {
    redirect("/");
  }

  const supabase = createServerComponentClient<Database>({
    cookies,
  });
  const hasSession = await supabase.auth.getSession();
  const cookieStore = cookies();

  const showApp =
    hasSession.data != null ||
    cookieStore.get(APP_COOKIE)?.value !== undefined ||
    process.env.NEXT_PUBLIC_ENV === "dev";

  // if (!showApp) {
  //   redirect("https://home.recipeui.com/");
  // }

  const { globalProjects, userProjects, recipe } = await fetchHome({
    searchParams,
    supabase,
  });

  if (recipeId && !recipe) {
    redirect("/");
  }

  return (
    <RecipeHomeContainer
      globalProjects={globalProjects}
      projects={userProjects}
      recipe={recipe || undefined}
      sessionId={sessionId}
    />
  );
}
