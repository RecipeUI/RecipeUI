import Downshift from "downshift";
import classNames from "classnames";
import { Recipe } from "../../types/recipes";
import Fuse from "fuse.js";
import { useMemo } from "react";
import { RouteTypeLabel } from "../RouteTypeLabel";

import { useDebounce } from "usehooks-ts";
import { useRecipeSessionStore } from "../../state/recipeSession";

export function RecipeBodySearch() {
  const recipes = useRecipeSessionStore((state) => state.recipes);
  const addSession = useRecipeSessionStore((state) => state.addSession);

  // TODO: Add shortcut to open search bar for CMD T
  // TODO: Make sure search bar opens when user starts typing
  return (
    <Downshift<Recipe>
      onChange={(selection) => {
        if (selection) {
          addSession(selection);
        }
      }}
      itemToString={(item) => (item ? item.path : "")}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        isOpen,
        inputValue,
        highlightedIndex,
        selectedItem: selectedRecipe,
        getRootProps,
      }) => (
        <div className="p-4">
          <div className="flex flex-col relative">
            <div
              className="flex space-x-2"
              {...getRootProps({}, { suppressRefError: true })}
            >
              <div className="input input-bordered flex-1 flex items-center space-x-2">
                {selectedRecipe?.method && (
                  <RouteTypeLabel recipeMethod={selectedRecipe.method} />
                )}
                <input
                  placeholder="Search..."
                  className="outline-none w-full"
                  {...getInputProps()}
                />
              </div>
              <button
                aria-label={"toggle menu"}
                className="btn w-24"
                type="button"
                onClick={() => {
                  // const options = {
                  //   method: "GET",
                  //   headers: {
                  //     Authorization:
                  //       "Bearer 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",
                  //   },
                  // };
                  // fetch("https://api.openai.com/v1/models", options)
                  //   .then((response) => response.json())
                  //   .then((response) => console.log(response))
                  //   .catch((err) => console.error(err));
                }}
              >
                Send
              </button>
            </div>
            <ul
              className={`absolute bg-white top-14 w-[calc(100%-6.5rem)] shadow-md max-h-80 overflow-scroll rounded-md border  z-10 ${
                !(isOpen && recipes.length) && "hidden"
              }`}
              {...getMenuProps()}
            >
              {isOpen && inputValue && (
                <RecipeListItems
                  inputValue={inputValue}
                  getItemProps={getItemProps}
                  highlightedIndex={highlightedIndex}
                  selectedRecipe={selectedRecipe}
                />
              )}
            </ul>
          </div>
        </div>
      )}
    </Downshift>
  );
}
function RecipeListItems({
  inputValue,
  getItemProps,
  highlightedIndex,
  selectedRecipe,
}: {
  inputValue: string;
  getItemProps: unknown;
  highlightedIndex: number | null;
  selectedRecipe: Recipe | null;
}) {
  const _recipes = useRecipeSessionStore((state) => state.recipes);
  const recipeSearch = useMemo(() => {
    return new Fuse(
      _recipes.map((recipe) => {
        const optionLabel = `${recipe.project} / ${recipe.title}`;

        return {
          ...recipe,
          label: optionLabel,
        };
      }),
      {
        keys: ["summary", "path", "optionLabel"],
        threshold: 0.4,
      }
    );
  }, [_recipes]);

  const debouncedInputValue = useDebounce(inputValue, 300);
  const recipes = useMemo(
    () => recipeSearch.search(debouncedInputValue).map((r) => r.item),
    [debouncedInputValue, recipeSearch]
  );

  return (
    <>
      {recipes.map((recipe, index) => {
        const optionLabel = `${recipe.project} / ${recipe.title}`;

        return (
          <li
            className={classNames(
              selectedRecipe?.path === recipe.path &&
                highlightedIndex !== index &&
                "bg-gray-300",
              highlightedIndex === index && "bg-blue-300",
              "py-2 px-4 shadow-sm flex space-x-2"
            )}
            // @ts-expect-error being lazy here with types
            {...getItemProps({
              key: optionLabel,
              index,
              item: recipe,
            })}
          >
            <RouteTypeLabel recipeMethod={recipe.method} />
            <div className="flex-1">
              <div className="text-base">
                <span className="">{optionLabel} - </span>
                <span>{recipe.path}</span>
              </div>
              {recipe.summary && (
                <div className="line-clamp-2 text-gray-600 text-sm">
                  {recipe.summary}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </>
  );
}
