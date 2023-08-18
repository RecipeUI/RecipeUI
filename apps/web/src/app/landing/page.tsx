import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { redirect } from "next/navigation";
import { APP_COOKIE } from "ui/utils/constants/main";
import { SimpleCookies } from "ui/components/Test/SimpleButton";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: {
    forceLoad?: boolean;
  };
}) {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });
  const cookieStore = cookies();
  const session = await supabase.auth.getSession();
  const hasSessionUser = session.data.session?.user != undefined;
  const hasAppCookie = cookieStore.get(APP_COOKIE)?.value !== undefined;
  const isLocalEnv = process.env.NEXT_PUBLIC_ENV === "dev";

  const showApp =
    hasSessionUser ||
    hasAppCookie ||
    isLocalEnv ||
    searchParams.forceLoad !== undefined;

  if (!showApp) {
    redirect("https://home.recipeui.com/");
  }

  return (
    <div>
      {hasAppCookie ? "hasAppCookie" : "noAppCookie"}
      <SimpleCookies />
    </div>
  );
}
