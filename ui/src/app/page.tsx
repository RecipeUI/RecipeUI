import { Providers } from "@/app/providers";
import { Navbar } from "@/components/Navbar";
import { RecipeContainer } from "@/components/RecipeContainer";

export default function Home() {
  return (
    <Providers>
      <div className="w-full h-screen flex flex-col">
        <Navbar />
        <RecipeContainer />
      </div>
    </Providers>
  );
}
