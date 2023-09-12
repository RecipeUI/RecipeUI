import classNames from "classnames";
import { RecipeMethod } from "types/enums";

export function RouteTypeLabel({
  recipeMethod,
  size = "large",
}: {
  recipeMethod: RecipeMethod;
  size?: string;
}) {
  const label = recipeMethod === RecipeMethod.DELETE ? "DEL" : recipeMethod;

  return (
    <span
      className={classNames(
        size === "large" && "w-14",
        size === "small" && "w-8",
        recipeMethod === RecipeMethod.GET && "text-green-600",
        recipeMethod === RecipeMethod.POST && "text-orange-600",
        recipeMethod === RecipeMethod.PUT && "text-orange-600",
        recipeMethod === RecipeMethod.PATCH && "text-orange-600",
        recipeMethod === RecipeMethod.DELETE && "text-red-600"
      )}
    >
      {label}
    </span>
  );
}
