import { useRecipeSessionStore } from "../../state/recipeSession";
import { RecipeBody } from ".";
import { RecipeBodySearch } from "./RecipeBodySearch";
import { RecipeHome } from "./RecipeHome";

export function RecipeBodyContainer() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div className="flex-1 flex flex-col">
      <RecipeBodySearch />
      {currentSession ? <RecipeBody /> : <RecipeHome />}
    </div>
  );
}
