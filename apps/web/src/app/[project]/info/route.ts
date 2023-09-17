import { Database } from "types/database";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      project: string;
    };
  }
) {
  const project = params.project;
  const supabase = createRouteHandlerClient<Database>({ cookies });

  return NextResponse.json({
    message: "Hello from the API",
    params,
  });
}
