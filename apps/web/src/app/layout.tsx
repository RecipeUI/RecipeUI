import { PostHogPageview, Providers } from "ui/components/Providers";
import "./initPosthog";
import "ui/css/globals.css";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Suspense } from "react";
import { RecipeLayout } from "./RecipeLayout";

const sora = Sora({ subsets: ["latin"] });

const metadataConstants = {
  title: "RecipeUI",
  description:
    "Open source postman alternative for teams. APIs made easy, no coding experience required.",
  image_url: "https://www.recipeui.com/opengraph-image.png",
};
export const metadata: Metadata = {
  openGraph: {
    title: metadataConstants.title,
    description: metadataConstants.description,
    url: "https://www.recipeui.com/",
    siteName: "RecipeUI",
    images: [
      {
        url: metadataConstants.image_url,
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: metadataConstants.title,
    description: metadataConstants.description,
    images: [
      {
        url: metadataConstants.image_url,
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  title: metadataConstants.title,
  description: metadataConstants.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <body className={sora.className}>
        <Providers>
          <RecipeLayout>{children}</RecipeLayout>
        </Providers>
      </body>
    </html>
  );
}
