import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { APP_COOKIE } from "ui/utils/constants/main";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: {
    forceLoad?: boolean;
  };
}) {
  const cookieStore = cookies();
  const hasAppCookie = cookieStore.get(APP_COOKIE)?.value !== undefined;
  const showApp = hasAppCookie || searchParams.forceLoad !== undefined;

  if (!showApp) {
    redirect("https://home.recipeui.com/");
  }

  return <div>{hasAppCookie ? "hasAppCookie" : "noAppCookie"}</div>;
}
