import { useCombobox } from "downshift";
import classNames from "classnames";
import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { RouteTypeLabel } from "../../RouteTypeLabel";

import { useDebounce } from "usehooks-ts";
import {
  DeepActionType,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeSearchButton } from "./RecipeSearchButton";

export function RecipeBodySearch() {
  const _recipes = useRecipeSessionStore((state) => state.recipes);
  const recipeWithLabels = useMemo(() => {
    const newRecipes = _recipes
      .filter((recipe) => !recipe.deprecated)
      .map((recipe) => {
        const optionLabel = `${recipe.project} ${recipe.title}`;

        return {
          ...recipe,
          label: optionLabel,
        };
      });
    newRecipes.sort((a, b) => {
      const lengthA = a.tags ? a.tags.length : 0;
      const lengthB = b.tags ? b.tags.length : 0;
      return lengthB - lengthA; // Sorting in descending order, so the item with the most tags comes first
    });

    return newRecipes;
  }, [_recipes]);

  const addSession = useRecipeSessionStore((state) => state.addSession);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const recipeSearch = useMemo(() => {
    return new Fuse(recipeWithLabels, {
      keys: ["summary", "path", "label"],
      threshold: 0.4,
    });
  }, [recipeWithLabels]);

  const [recipes, setRecipes] = useState(recipeWithLabels);
  const [localInputValue, setLocalInputValue] = useState("");

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    openMenu,
    selectedItem: selectedRecipe,
    getItemProps,
    setInputValue,
  } = useCombobox({
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue) return;
      setLocalInputValue(inputValue);

      const items = recipeSearch.search(inputValue).map((r) => {
        return r.item;
      });
      setRecipes(items);
    },
    items: recipes,
    itemToString(item) {
      return item ? item.path : "";
    },
    selectedItem: currentSession?.recipe || null,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        addSession(selectedItem);
      }
    },
  });

  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setCurrentSession(null);
        // TODO: This is a bug, it won't let me initialize empty values
        setInputValue("");
        setLocalInputValue("");
        openMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  const deepActions = useRecipeSessionStore((state) => state.deepActions);
  const clearDeepAction = useRecipeSessionStore(
    (state) => state.clearDeepAction
  );
  useEffect(() => {
    const updateInputAction = deepActions.find(
      (dA) => dA.type === DeepActionType.UpdateRecipeInput
    );
    if (updateInputAction) {
      openMenu();
      setInputValue(updateInputAction.payload);
      clearDeepAction(DeepActionType.UpdateRecipeInput);
    }
  }, [clearDeepAction, deepActions, openMenu, setInputValue]);

  const debouncedInputValue = useDebounce(localInputValue, 300);
  useEffect(() => {
    if (!debouncedInputValue) {
      setRecipes(recipeWithLabels);
      return;
    }

    const items = recipeSearch.search(debouncedInputValue).map((r) => {
      return r.item;
    });
    setRecipes(items);
  }, [debouncedInputValue, recipeSearch]);

  return (
    <div className="p-4">
      <div className="flex flex-col relative">
        <div className="flex sm:space-x-2 flex-col sm:flex-row">
          <div
            className="input input-bordered flex-1 flex items-center space-x-2 py-4 mb-2 sm:mb-0"
            onClick={() => {}}
          >
            {selectedRecipe?.method && (
              <RouteTypeLabel recipeMethod={selectedRecipe.method} />
            )}
            <input
              ref={ref}
              onClick={() => {
                if (!isOpen) openMenu();
              }}
              placeholder="Start typing here to search.... (Shortcut: CMD+K)"
              className="outline-none w-full dark:bg-transparent"
              {...getInputProps()}
            />
          </div>
          <RecipeSearchButton />
        </div>
        <ul
          className={`absolute bg-white top-14 w-full mt-2 sm:mt-0 sm:w-[calc(100%-6.5rem)] shadow-md max-h-80 overflow-auto  rounded-md border z-10 
          ${!isOpen && "hidden"}

          `}
          {...getMenuProps()}
        >
          {isOpen && (
            <>
              {recipes.map((recipe, index) => {
                return (
                  <li
                    className={classNames(
                      selectedRecipe?.path === recipe.path &&
                        highlightedIndex !== index &&
                        "bg-gray-300",
                      highlightedIndex === index &&
                        "bg-blue-300 dark:!bg-neutral-700",
                      "py-2 px-4 shadow-sm flex space-x-2 dark:bg-neutral-800"
                    )}
                    {...getItemProps({
                      // TODO: Fix this
                      key: recipe.path + recipe.method,
                      index,
                      item: recipe,
                    })}
                  >
                    <RouteTypeLabel recipeMethod={recipe.method} />
                    <div className="flex-1">
                      <div className="text-base dark:text-gray-300 space-x-2">
                        <span>{recipe.path}</span>
                        {recipe.tags?.map((tag) => (
                          <div className="badge badge-neutral" key={tag}>
                            {tag}
                          </div>
                        ))}
                      </div>
                      <div className="line-clamp-2 text-gray-600 text-sm dark:text-gray-400">
                        {recipe.title}
                        {recipe.summary && `: ${recipe.summary}`}
                      </div>
                    </div>
                  </li>
                );
              })}
              {Boolean(recipes.length === 0 && debouncedInputValue) && (
                <li className="py-2 px-4 shadow-sm flex sm:space-x-2 dark:bg-neutral-600">
                  <div className="flex-1">
                    <div className="text-base">
                      <span className="">No recipes found for </span>
                      <span>"{debouncedInputValue}". </span>
                      <span>
                        We'll constantly add new recipes from the community!
                      </span>
                    </div>
                  </div>
                </li>
              )}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
