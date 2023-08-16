import { ImageResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "types";
import { cookies } from "next/headers";
import { RecipeProject, UserTemplatePreview } from "types";

// NextJS x Supabase bug unfortunately.
// export const runtime = "edge";

export const alt = "RecipeUI";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { project: string };
}) {
  //   const supabase = createServerComponentClient<Database>({
  //     cookies,
  //   });

  //   const { data: _projectInfo } = await supabase
  //     .from("project")
  //     .select()
  //     .ilike("project", `%${params.project}%`)
  //     .single();

  //   const recipeProject = _projectInfo as RecipeProject | null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#F0A500",
          padding: "0 4rem",
        }}
      >
        <div tw="flex flex-col items-start">
          <h1 tw="text-6xl font-bold">Recipes for ${params.project}</h1>
          <p tw="text-4xl -mt-2">View on RecipeUI</p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
