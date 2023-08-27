"use client";

import { PostHogPageview, Providers } from "ui/components/Providers";
import "ui/css/globals.css";
import { Sora } from "next/font/google";
import { Navbar } from "ui/components/Navbar/Navbar";
import { Suspense } from "react";

const sora = Sora({ subsets: ["latin"] });

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
          <div className="w-full h-screen flex overflow-y-auto border-t border-recipe-slate">
            <div className="flex flex-1 flex-col overflow-y-scroll">
              <Navbar />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
