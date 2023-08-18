import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types/database";
import { redirect } from "next/navigation";
import { APP_COOKIE } from "ui/utils/constants/main";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });
  const hasSession = await supabase.auth.getSession();
  const cookieStore = cookies();

  const showApp =
    hasSession.data != null ||
    cookieStore.get(APP_COOKIE)?.value !== undefined ||
    process.env.NEXT_PUBLIC_ENV === "dev";

  if (!showApp) {
    redirect("https://home.recipeui.com/");
  }

  return <div>Page loaded</div>;
}
