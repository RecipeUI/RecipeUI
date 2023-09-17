import { Database } from "types/database";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isUUID } from "utils";

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      api_id: string;
    };
  }
) {
  const project = params.api_id;
  const supabase = createRouteHandlerClient<Database>({ cookies });
  // const coreAPIs

  if (!isUUID(project)) {
    return NextResponse.error();
  }

  return NextResponse.json({
    message: "Hello from the API",
    params,
  });
}
