import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { APP_COOKIE } from "ui/utils/constants/main";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const cookieStore = cookies();

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    await supabase.auth.signOut();
    cookieStore.delete(APP_COOKIE);
  }

  return NextResponse.redirect(new URL("/", req.url), {
    status: 302,
  });
}
