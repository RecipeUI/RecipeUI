import classNames from "classnames";
import { RecipeMethod } from "../types/recipes";

export function RouteTypeLabel({
  recipeMethod,
}: {
  recipeMethod: RecipeMethod;
}) {
  return (
    <span
      className={classNames(
        "w-14",
        recipeMethod === RecipeMethod.GET && "text-green-600",
        recipeMethod === RecipeMethod.POST && "text-orange-600",
        recipeMethod === RecipeMethod.PUT && "text-orange-600",
        recipeMethod === RecipeMethod.DELETE && "text-red-600"
      )}
    >
      {recipeMethod}
    </span>
  );
}
