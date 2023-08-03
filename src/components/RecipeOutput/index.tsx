import classNames from "classnames";
import {
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeDocs } from "./RecipeDocs";

export function RecipeOutput() {
  const currentTab = useRecipeSessionStore((state) => state.outputTab);
  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const output = useRecipeSessionStore((state) => state.output);

  return (
    <div className="flex-1 relative border-t sm:border-l sm:border-t-0">
      {currentTab === RecipeOutputTab.Docs && <RecipeDocs />}
      {currentTab === RecipeOutputTab.Output && <RecipeOutputConsole />}
      {Object.keys(output).length > 0 && (
        <div className="absolute right-0 top-0 flex border-l border-b">
          {[RecipeOutputTab.Docs, RecipeOutputTab.Output].map((tab) => {
            return (
              <div
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={classNames(
                  "first:!border-l-0 border-l px-2 py-1 cursor-pointer ",
                  currentTab === RecipeOutputTab.Docs
                    ? ""
                    : "bg-gray-600 text-white"
                )}
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

export function RecipeOutputConsole() {
  const output = useRecipeSessionStore((state) => state.output);

  return (
    <div className="sm:absolute inset-0 px-4 py-6 overflow-y-auto bg-gray-600 text-white">
      <h1 className="text-xl font-bold">Output</h1>
      {Object.keys(output).length > 0 && (
        <pre className="mt-2 whitespace-break-spaces">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
