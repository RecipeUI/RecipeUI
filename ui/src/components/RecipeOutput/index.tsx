import classNames from "classnames";
import {
  RecipeOutputTab,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeDocs } from "./RecipeDocs";
import { ReactNode, useEffect, useMemo } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

// This library is ridiculously large. We should try to replace it with something lightweight.
import JsonView from "react18-json-view";
import { useDarkMode } from "usehooks-ts";

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
    <div className="flex-1 relative border-t sm:border-l sm:border-t-0">
      {currentTab === RecipeOutputTab.Docs && <RecipeDocs />}
      {currentTab === RecipeOutputTab.Output && <RecipeOutputConsole />}
      {(Object.keys(output).length > 0 ||
        currentTab === RecipeOutputTab.Output) && (
        <div className="absolute right-0 top-0 flex border-l border-b">
          {[RecipeOutputTab.Docs, RecipeOutputTab.Output].map((tab) => {
            return (
              <div
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={classNames(
                  "first:!border-l-0 border-l px-2 py-2 cursor-pointer tooltip bg-neutral-200 dark:text-gray-800",
                  currentTab === RecipeOutputTab.Docs ? "" : "!bg-chefYellow "
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

export function RecipeOutputConsole() {
  const getOutput = useRecipeSessionStore((state) => state.getOutput);

  const { output, type: outputType } = getOutput();
  const isSending = useRecipeSessionStore((state) => state.isSending);

  const { imageBlocks, codeBlocks } = useMemo(() => {
    // Even though we can match on this, it's not good because stringify removes some whitespace

    const codeBlockRegex = /```(.*?)```/gs;
    const imageRegex =
      /(https?:\/\/[^\s'"]+\.(png|jpg|jpeg|gif|bmp|webp)(\?[^\s'"]*)?)/g;

    const codeBlocks: string[] = [];
    const imageBlocks: string[] = [];

    function checkObjs(obj: Record<string, unknown>) {
      Object.values(obj).forEach((value) => {
        if (typeof value === "object") {
          checkObjs((value || {}) as Record<string, unknown>);
        } else if (typeof value === "string") {
          // We'll ocassionally hardcode edgecases. Unsplash doesn't have standardized image urls
          if (value.includes("images.unsplash")) {
            imageBlocks.push(value);
          }

          const codeBlockMatch = value
            .match(codeBlockRegex)
            ?.map((match) => match.replace(/```/g, ""));
          if (codeBlockMatch) codeBlocks.push(...codeBlockMatch);

          const imageMatch = value.match(imageRegex);

          if (imageMatch) imageBlocks.push(...imageMatch);
        }
      });
    }
    checkObjs(output);

    return { codeBlocks, imageBlocks };
  }, [output]);

  const { isDarkMode } = useDarkMode();

  return (
    <div className="sm:absolute inset-0 px-4 py-6 overflow-y-auto bg-gray-800 dark:bg-gray-700 text-white space-y-6">
      {imageBlocks.length > 0 && (
        <>
          <OutputModule
            title="Images Found"
            tooltip="We found these image URLs from the response."
            body={
              <>
                {imageBlocks.length > 1 && (
                  <p className="mb-2">
                    We found {imageBlocks.length} images. Scroll right to see
                    them all.
                  </p>
                )}
                <div className="carousel rounded-box">
                  {imageBlocks.map((imageUrl, i) => {
                    return (
                      <img
                        src={imageUrl}
                        key={imageUrl + i}
                        className="carousel-item rounded-md max-h-48 object-contain"
                        alt={""}
                      />
                    );
                  })}
                </div>
              </>
            }
          />
        </>
      )}
      {codeBlocks.length > 0 && (
        <OutputModule
          title="Code Blocks Found"
          tooltip="We found these code snippets from the response."
          body={
            <div className="space-y-4">
              {codeBlocks.map((codeBlock, i) => {
                return (
                  <div className="mockup-code text-sm" key={i}>
                    <pre className="px-8 whitespace-pre-wrap">
                      <code className="">{codeBlock}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          }
        />
      )}
      {!isSending ? (
        <OutputModule
          title="Response"
          body={
            <JsonView
              src={output}
              collapsed={false}
              collapseStringsAfterLength={1000}
              collapseObjectsAfterLength={1000}
            />
          }
        />
      ) : (
        <div className="flex items-end mb-2">
          <h1 className="text-xl font-bold">Fetching response</h1>
          <span className="loading loading-bars loading-md  ml-2"></span>
        </div>
      )}
    </div>
  );
}

function OutputModule({
  title,
  body,
  tooltip,
}: {
  title: string;
  body: ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="">
      <div className="flex items-center mb-2">
        <h1 className="text-xl font-bold">{title}</h1>
        {tooltip && (
          <span
            className="tooltip tooltip-right tooltip-accent ml-2"
            data-tip={tooltip}
          >
            <InformationCircleIcon className="w-5 h-5" />
          </span>
        )}
      </div>
      {body}
    </div>
  );
}
