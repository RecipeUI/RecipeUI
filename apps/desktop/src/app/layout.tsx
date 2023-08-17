"use client";

import { PostHogPageview, Providers } from "ui/components/Providers";
import "ui/css/globals.css";
import { Inter } from "next/font/google";
import { Navbar } from "ui/components/Navbar/Navbar";
import { RecipeSidebar } from "ui/components/RecipeSidebar";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

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
