"use client";
import { useCombobox } from "downshift";
import classNames from "classnames";
import Fuse from "fuse.js";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RouteTypeLabel } from "../../RouteTypeLabel";

import { useDebounce } from "usehooks-ts";
import {
  DeepActionType,
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeSearchButton } from "./RecipeSearchButton";
import { usePathname, useRouter } from "next/navigation";
import { getURLParamsForSession } from "@/utils/main";
import { RecipeSaveButton } from "@/components/RecipeBody/RecipeBodySearch/RecipeSaveButton";

export function RecipeBodySearch() {
  const addSession = useRecipeSessionStore((state) => state.addSession);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const _recipes = useRecipeSessionStore((state) => state.recipes);

  const [recipes, setRecipes] = useState(_recipes);
  const router = useRouter();
  const currentSessionRecipe = useContext(RecipeContext);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    openMenu,
    selectedItem: selectedRecipe,
    getItemProps,
    setInputValue,
    inputValue,
  } = useCombobox({
    id: "recipe-search",
    items: recipes,
    itemToString(item) {
      return item ? item.path : "";
    },
    selectedItem: currentSessionRecipe || null,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        const newSession = addSession(selectedItem);
        router.push(`/?${getURLParamsForSession(newSession)}`);
      }
    },
  });

  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();

        if (currentSession !== null) {
          setCurrentSession(null);
          setInputValue("");
          router.push("/");
        } else {
          openMenu();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu, currentSession]);

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

  const recipeSearch = useMemo(() => {
    return new Fuse(_recipes, {
      keys: ["summary", "path", "label"],
      threshold: 0.4,
      sortFn: (a, b) => {
        const a_tags = (_recipes[a.idx].tags || []).length;
        const b_tags = (_recipes[b.idx].tags || []).length;

        if (a_tags > b_tags) return -1;
        else if (a_tags < b_tags) return 1;

        return a.score - b.score;
      },
    });
  }, [_recipes]);

  const debouncedInputValue = useDebounce(inputValue, 300);
  useEffect(() => {
    if (!debouncedInputValue) {
      setRecipes(_recipes);
      return;
    }
    const items = recipeSearch.search(debouncedInputValue).map((r) => {
      return r.item;
    });
    setRecipes(items);
  }, [debouncedInputValue, recipeSearch]);

  return (
    <div className="md:p-4 pb-4 p-4 sm:p-0">
      <div
        className={classNames(
          "flex flex-col relative",
          currentSession == null && "hidden sm:block"
        )}
      >
        <div className="flex space-x-2 sm:flex sm:space-x-2 sm:flex-row">
          <div
            className={classNames(
              "input input-bordered flex-1 flex items-center space-x-2 py-4 mb-2 sm:mb-0 border-slate-600"
            )}
            data-tip={
              currentSession
                ? "You cannot edit a recipe URL. Start a new session with CMD+K"
                : ""
            }
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
              className={classNames(
                "outline-none w-full dark:bg-transparent"
                // currentSession && "pointer-events-none"
              )}
              {...getInputProps()}
            />
          </div>
          {currentSession != null && currentSessionRecipe != null && (
            <div className="grid grid-flow-col gap-x-2">
              <RecipeSearchButton />
              <RecipeSaveButton />
            </div>
          )}
        </div>
        <ul
          className={classNames(
            "w-full mt-2 sm:w-[calc(100%-6.5rem)] shadow-md max-h-80 overflow-auto  rounded-md border z-10",
            !isOpen && "hidden",
            currentSession && "hidden"
          )}
          {...getMenuProps()}
        >
          {isOpen && (
            <>
              {recipes.map((recipe, index) => {
                return (
                  // eslint-disable-next-line react/jsx-key
                  <li
                    className={classNames(
                      selectedRecipe?.path === recipe.path &&
                        highlightedIndex !== index &&
                        "bg-gray-300",
                      highlightedIndex === index &&
                        "bg-blue-300 dark:!bg-neutral-700",
                      "py-2 px-4 shadow-sm flex space-x-2 dark:bg-neutral-800"
                    )}
                    key={recipe.path + recipe.method}
                    {...getItemProps({
                      index,
                      item: recipe,
                    })}
                  >
                    <RouteTypeLabel recipeMethod={recipe.method} />
                    <div className="flex-1">
                      <div className="text-base dark:text-gray-300 line-clamp-1">
                        {recipe.title}
                        {recipe.summary && `: ${recipe.summary}`}
                      </div>
                      <div className="  space-x-2 text-sm text-gray-600  dark:text-gray-400">
                        <span>{recipe.path}</span>
                        {recipe.tags?.map((tag) => (
                          <div
                            className="badge badge-neutral badge-sm"
                            key={tag}
                          >
                            {tag}
                          </div>
                        ))}
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
                      <span>{`"${debouncedInputValue}". `}</span>
                      <span>
                        {"We'll constantly add new recipes from the community!"}
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
