import { Providers } from "@/app/providers";
import { Navbar } from "@/components/Navbar";
import { RecipeBody } from "@/components/RecipeBody";
import { RecipeBodyContainer } from "@/components/RecipeBody/RecipeBodyContainer";
import { RecipeContainer } from "@/components/RecipeContainer";
import { RecipeSidebar } from "@/components/RecipeSidebar";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database.types";
import { RecipeProject } from "@/types/databaseExtended";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projectsResponse = await createServerComponentClient<Database>({
    cookies,
  })
    .from("project")
    .select();

  const projects = (projectsResponse.data || []) as RecipeProject[];
  return (
    <Providers>
      <div className="w-full h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1 border-t">
          <RecipeSidebar />
          <RecipeBodyContainer recipeProjects={projects} />
        </div>
      </div>
    </Providers>
  );
}
