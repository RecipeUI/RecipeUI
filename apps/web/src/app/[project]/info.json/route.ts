import { Database } from "types/database";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isUUID } from "utils";
import { fetchProjectPage } from "ui/fetchers/project";

export const revalidate = 3600;

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
  // const coreAPIs

  if (!project || !isUUID(project)) {
    return NextResponse.json(
      {
        error: "Invalid project ID.",
      },
      {
        status: 404,
      }
    );
  }

  const projectInfo = await fetchProjectPage({
    supabase,
    project: project,
  });

  if (!projectInfo) {
    return NextResponse.json(
      {
        error: "Project not found.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(projectInfo);
}
