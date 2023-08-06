import { useRecipeSessionStore } from "../../state/recipeSession";
import { RecipeBody } from ".";
import { RecipeBodySearch } from "./RecipeBodySearch";
import { RecipeHome } from "./RecipeHome";
import classNames from "classnames";

export function RecipeBodyContainer() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  return (
    <div
      className={classNames(
        "flex-1 flex flex-col",
        currentSession === null && "px-6 pb-6 pt-4"
      )}
    >
      <RecipeBodySearch />
      {currentSession ? <RecipeBody /> : <RecipeHome />}
    </div>
  );
}
