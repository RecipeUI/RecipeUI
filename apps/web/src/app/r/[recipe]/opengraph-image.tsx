import { ImageResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database, UserTemplatePreview } from "types/database";
import { cookies } from "next/headers";

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
  params: { recipe: string };
}) {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const {
    data: templateData,
    error,
    status,
  } = await supabase
    .from("template_view")
    .select(
      "id, created_at, title, description, original_author, recipe, visibility, alias"
    )
    .eq("alias", params.recipe)
    .single();

  const sharedTemplateInfo = templateData as UserTemplatePreview | null;

  const title = sharedTemplateInfo
    ? `${sharedTemplateInfo.recipe.project} API | ${sharedTemplateInfo.title}`
    : "RecipeUI: Private Recipe";
  const username = sharedTemplateInfo
    ? `Built by @${sharedTemplateInfo.original_author.username}`
    : null;
  const description = sharedTemplateInfo
    ? sharedTemplateInfo.description
    : null;

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
          fontFamily: "Inter, sans-serif, arial",
        }}
      >
        <div tw="flex flex-col items-start">
          <h1 tw="text-6xl font-bold">{title}</h1>
          {username && <p tw="text-4xl -mt-2">{username}</p>}
          {description && <p tw="text-5xl font-normal mt-14">{description}</p>}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
