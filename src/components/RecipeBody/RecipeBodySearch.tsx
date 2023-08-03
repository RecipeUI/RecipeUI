import Downshift from "downshift";
import classNames from "classnames";
import { Recipe, RecipeAuthType } from "../../types/recipes";
import Fuse from "fuse.js";
import { useEffect, useMemo, useRef } from "react";
import { RouteTypeLabel } from "../RouteTypeLabel";

import { useDebounce } from "usehooks-ts";
import {
  RecipeOutputType,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useSecretManager } from "../../state/recipeAuth";

export function RecipeBodySearch() {
  const recipes = useRecipeSessionStore((state) => state.recipes);
  const addSession = useRecipeSessionStore((state) => state.addSession);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const setCurrentSession = useRecipeSessionStore(
    (state) => state.setCurrentSession
  );

  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setCurrentSession(null);

        ref.current?.click();
        ref.current?.focus();
        ref.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <Downshift<Recipe>
      onChange={(selection) => {
        if (selection) addSession(selection);
      }}
      selectedItem={currentSession?.recipe || null}
      itemToString={(item) => (item ? item.path : "")}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        openMenu,
        isOpen,
        inputValue,
        highlightedIndex,
        selectedItem: selectedRecipe,
        getRootProps,
      }) => (
        <div className="p-4">
          <div className="flex flex-col relative">
            <div
              className="flex sm:space-x-2 flex-col sm:flex-row"
              {...getRootProps({}, { suppressRefError: true })}
            >
              <div className="input input-bordered flex-1 flex items-center space-x-2 py-4 mb-2 sm:mb-0">
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
              className={`absolute bg-white top-14 w-full mt-2 sm:mt-0 sm:w-[calc(100%-6.5rem)] shadow-md max-h-80 overflow-auto  rounded-md border z-10 ${
                !(isOpen && recipes.length) && "hidden"
              }`}
              {...getMenuProps()}
            >
              {isOpen && (
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

function RecipeSearchButton() {
  const currentSession = useRecipeSessionStore((store) => store.currentSession);
  const requestBody = useRecipeSessionStore((store) => store.requestBody);
  const setOutput = useRecipeSessionStore((store) => store.setOutput);
  const clearOutput = useRecipeSessionStore((store) => store.clearOutput);
  const sm = useSecretManager();
  const fileManager = useRecipeSessionStore((store) => store.fileManager);

  const isSending = useRecipeSessionStore((store) => store.isSending);
  const setIsSending = useRecipeSessionStore((store) => store.setIsSending);

  const onSubmit = async () => {
    setIsSending(true);
    clearOutput();

    await _onSubmit();
    setTimeout(() => {
      setIsSending(false);
    }, 500);
  };
  const _onSubmit = async () => {
    if (!currentSession) return;

    const { recipe } = currentSession;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (recipe.auth) {
      const token = sm.getSecret(recipe.project);
      if (!token) {
        alert("Please setup authentication first.");
        return;
      }

      if (recipe.auth === RecipeAuthType.Bearer) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    let body: undefined | string | FormData;

    // TODO: We can have very strict validation eventually
    if (
      "requestBody" in currentSession.recipe &&
      "objectSchema" in currentSession.recipe.requestBody
    ) {
      const { objectSchema } = currentSession.recipe.requestBody;
      const requiredKeys = Object.keys(objectSchema).filter(
        (key) => objectSchema[key].required
      );

      // TODO: Move this to terminal
      if (requiredKeys.length > Object.keys(requestBody).length) {
        alert("Please fill in all required fields.");
        return;
      }

      const contentType = currentSession.recipe.requestBody.contentType;

      if (contentType === "application/json") {
        body = JSON.stringify(requestBody);
      } else if (contentType === "multipart/form-data") {
        // https://github.com/JakeChampion/fetch/issues/505#issuecomment-293064470
        delete headers["Content-Type"];

        const formData = new FormData();

        for (const key in requestBody) {
          let payload = requestBody[key];

          if (typeof payload === "object" && payload !== null) {
            payload = JSON.stringify(payload);
          }

          if (key === "file") {
            // This only works well for 1 layer deep route. Think of something better when we bump into multi layer
            const file = fileManager[currentSession.id];
            if (!file) {
              alert("Please upload a file first.");
              return;
            }
            payload = file;
          }

          formData.append(key, payload as string | Blob);
        }
        body = formData;
      }
    }

    try {
      const payload = {
        method: recipe.method,
        headers,
        body,
      };

      const res = await fetch(recipe.path, payload);
      const json = await res.json();

      setOutput({
        output: json,
        outputType: RecipeOutputType.Response,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        ref.current?.click();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="tooltip tooltip-bottom" data-tip="CMD+Enter">
      <button
        ref={ref}
        className={classNames(
          "btn dark:btn-accent dark:text-white sm:w-24 w-full",
          (!currentSession || isSending) && "btn-disabled"
        )}
        type="button"
        onClick={onSubmit}
      >
        {isSending ? (
          <span className="loading loading-infinity"></span>
        ) : (
          <span>Send</span>
        )}
      </button>
    </div>
  );
}

function RecipeListItems({
  inputValue,
  getItemProps,
  highlightedIndex,
  selectedRecipe,
}: {
  inputValue: string | null;
  getItemProps: unknown;
  highlightedIndex: number | null;
  selectedRecipe: Recipe | null;
}) {
  const _recipes = useRecipeSessionStore((state) => state.recipes);
  const recipeWithLabels = useMemo(
    () =>
      _recipes.map((recipe) => {
        const optionLabel = `${recipe.project} / ${recipe.title}`;

        return {
          ...recipe,
          label: optionLabel,
        };
      }),
    [_recipes]
  );

  const recipeSearch = useMemo(() => {
    return new Fuse(recipeWithLabels, {
      keys: ["summary", "path", "optionLabel"],
      threshold: 0.4,
    });
  }, [recipeWithLabels]);

  const debouncedInputValue = useDebounce(inputValue, 300);
  const recipes = useMemo(() => {
    if (!debouncedInputValue) return recipeWithLabels;

    return recipeSearch.search(debouncedInputValue).map((r) => {
      return r.item;
    });
  }, [debouncedInputValue, recipeSearch]);

  if (recipes.length === 0 && inputValue) {
    return (
      <li className="py-2 px-4 shadow-sm flex sm:space-x-2 dark:bg-neutral-600">
        <div className="flex-1">
          <div className="text-base">
            <span className="">No recipes found for </span>
            <span>"{inputValue}". </span>
            <span>We'll constantly add new recipes from the community!</span>
          </div>
        </div>
      </li>
    );
  }

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
              highlightedIndex === index && "bg-blue-300 dark:!bg-neutral-700",
              "py-2 px-4 shadow-sm flex space-x-2 dark:bg-neutral-800"
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
              <div className="text-base dark:text-gray-300">
                <span>{recipe.path}</span>
              </div>
              <div className="line-clamp-2 text-gray-600 text-sm dark:text-gray-400">
                {recipe.title}
                {recipe.summary && `: ${recipe.summary}`}
              </div>
            </div>
          </li>
        );
      })}
    </>
  );
}
