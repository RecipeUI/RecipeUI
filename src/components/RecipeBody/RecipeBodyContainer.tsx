import { useRecipeSessionStore } from "../../state/recipeSession";
import { RecipeBody } from ".";
import { RecipeBodySearch } from "./RecipeBodySearch";

export function RecipeBodyContainer() {
  const selectedRecipe = useRecipeSessionStore((state) => state.selectedRecipe);

  return (
    <div className="flex-1 flex flex-col">
      <RecipeBodySearch />
      {selectedRecipe && <RecipeBody />}
    </div>
  );
}
