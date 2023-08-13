import classNames from "classnames";
import {
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeDocs } from "./RecipeDocs";
import { useContext, useEffect } from "react";

// This library is ridiculously large. We should try to replace it with something lightweight.
import { RecipeOutputConsole } from "./RecipeOutputConsole";
import { RecipeCodeView } from "@/components/RecipeOutput/RecipeCodeView";

export function RecipeOutput() {
  const currentTab = useRecipeSessionStore((state) => state.outputTab);
  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const getOutput = useRecipeSessionStore((state) => state.getOutput);
  const output = getOutput();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === "d") {
          event.preventDefault();

          if (currentTab === RecipeOutputTab.Docs) {
            setCurrentTab(RecipeOutputTab.Output);
          } else {
            setCurrentTab(RecipeOutputTab.Docs);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Remove the keydown event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentTab, setCurrentTab]);

  return (
    <div className="flex-1 relative border-t sm:border-l sm:border-t-0 overflow-x-auto sm:max-w-none max-w-sm">
      {currentTab === RecipeOutputTab.Docs && <RecipeDocs />}
      {currentTab === RecipeOutputTab.Output && <RecipeOutputConsole />}
      {currentTab === RecipeOutputTab.Code && <RecipeCodeView />}
      {(Object.keys(output).length > 0 ||
        currentTab === RecipeOutputTab.Output) && (
        <div className="absolute right-0 top-0 flex border-l border-b">
          {[
            RecipeOutputTab.Docs,
            RecipeOutputTab.Output,
            RecipeOutputTab.Code,
          ].map((tab) => {
            return (
              <div
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={classNames(
                  "text-sm py-1 sm:text-base first:!border-l-0 border-l px-2 sm:py-2 cursor-pointer tooltip bg-chefYellow dark:text-gray-800"
                )}
                data-tip={"CMD+D"}
              >
                {tab}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
