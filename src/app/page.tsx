import { Navbar } from "@/components/Navbar";
import { RecipeContainer } from "@/components/RecipeContainer";

export default function Home() {
  return (
    <div className="w-full h-screen flex flex-col">
      <Navbar />
      <RecipeContainer />
    </div>
  );
}
