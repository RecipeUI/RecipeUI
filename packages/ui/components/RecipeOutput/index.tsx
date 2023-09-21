import classNames from "classnames";
import {
  RecipeContext,
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useContext, useEffect, useMemo } from "react";

import { RecipeOutputConsole } from "./RecipeOutputConsole";
import { RecipeCodeView } from "./RecipeCodeView";
import { RecipeEditDocs } from "./RecipeEditDocs";
import { useOutput } from "../../state/apiSession/OutputAPI";
import { RecipeDocs } from "./RecipeDocsv1";
import { RecipeHistoryView } from "./RecipeHistoryView";

export function RecipeOutput() {
  const currentTab = useRecipeSessionStore((state) => state.outputTab);
  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);

  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const { output, allOutputs } = useOutput(currentSession?.id);
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const recipe = useContext(RecipeContext);
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

  const editorMode = useRecipeSessionStore((state) => state.editorMode);
  const tabs = useMemo(() => {
    if (
      Object.keys(output).length === 0 &&
      currentTab !== RecipeOutputTab.Output
    ) {
      return [];
    }

    const _tabs = editorMode
      ? [RecipeOutputTab.DocTwo, RecipeOutputTab.Output]
      : [RecipeOutputTab.Docs, RecipeOutputTab.Output];

    _tabs.push(RecipeOutputTab.Code);

    if (allOutputs.length > 1) {
      _tabs.push(RecipeOutputTab.History);
    }

    return _tabs;
  }, [output, currentTab, editorMode]);

  return (
    <div className="flex-1 relative border-t sm:border-l border-slate-200 dark:border-slate-600 sm:border-t-0   w-full overflow-x-clip">
      {currentTab === RecipeOutputTab.Docs && <RecipeDocs />}
      {currentTab === RecipeOutputTab.DocTwo && <RecipeEditDocs />}
      {currentTab === RecipeOutputTab.Output && <RecipeOutputConsole />}
      {currentTab === RecipeOutputTab.Code && <RecipeCodeView />}
      {currentTab === RecipeOutputTab.History && <RecipeHistoryView />}
      {!loadingTemplate && tabs.length && (
        <div className="absolute right-0 top-0 flex border-l border-b border-slate-200 dark:border-slate-600">
          {tabs.map((tab) => {
            return (
              <div
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={classNames(
                  "text-sm py-1 sm:text-sm first:!border-l-0 border-l border-slate-200 dark:border-slate-600 px-1 sm:py-1 cursor-pointer tooltip bg-chefYellow dark:text-gray-800"
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
