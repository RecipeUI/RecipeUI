import { PostHogPageview, Providers } from "@/app/providers";
import "ui/css/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar/Navbar";
import { RecipeSidebar } from "@/components/RecipeSidebar";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

const metadataConstants = {
  title: "RecipeUI",
  description:
    "Discover how to use APIs from ChatGPT, GIPHY, Reddit, PokeAPI, and more in under a minute.",
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
      <body className={inter.className}>
        <Providers>
          <div className="w-full h-screen flex flex-col overflow-y-auto">
            <Navbar />
            <div className="flex flex-1">
              <RecipeSidebar />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
