import classNames from "classnames";
import {
  RecipeOutputTab,
  RecipeOutputType,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeDocs } from "./RecipeDocs";
import { ReactNode, useMemo } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export function RecipeOutput() {
  const currentTab = useRecipeSessionStore((state) => state.outputTab);
  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const output = useRecipeSessionStore((state) => state.output);

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
                  "first:!border-l-0 border-l px-2 py-2 cursor-pointer",
                  currentTab === RecipeOutputTab.Docs
                    ? "bg-neutral-300 text-black  dark:bg-neutral-800 dark:text-white"
                    : "bg-neutral-900 text-white"
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
  const isSending = useRecipeSessionStore((state) => state.isSending);
  const outputType = useRecipeSessionStore((state) => state.outputType);

  const { stringifiedOutput, imageBlocks, codeBlocks } = useMemo(() => {
    // Even though we can match on this, it's not good because stringify removes some whitespace
    const stringifiedOutput = JSON.stringify(output, null, 2);

    const codeBlockRegex = /```(.*?)```/gs;
    const imageRegex =
      /(https?:\/\/[^\s'"]+\.(png|jpg|jpeg|gif|bmp|webp)(\?[^\s'"]*)?)/g;

    // const codeBlocks = stringifiedOutput.match(codeBlockRegex) || [];
    // const imageBlocks = stringifiedOutput.match(imageRegex) || [];
    const codeBlocks: string[] = [];
    const imageBlocks: string[] = [];

    function checkObjs(obj: Record<string, unknown>) {
      Object.values(obj).forEach((value) => {
        if (typeof value === "object") {
          checkObjs((value || {}) as Record<string, unknown>);
        } else if (typeof value === "string") {
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

    return { codeBlocks, imageBlocks, stringifiedOutput };
  }, [output]);

  return (
    <div className="sm:absolute inset-0 px-4 py-6 overflow-y-auto bg-gray-600 text-white space-y-6">
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
                        className="carousel-item rounded-md max-h-48 object-cover"
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
            <>
              <div
                className={classNames(
                  outputType === RecipeOutputType.Error && "mockup-code"
                )}
              >
                <pre
                  className={classNames(
                    "mt-2 whitespace-break-spaces",
                    outputType === RecipeOutputType.Error &&
                      "bg-warning text-warning-content px-2"
                  )}
                >
                  {stringifiedOutput}
                </pre>
              </div>
              {Object.keys(output).length > 0 && (
                <button
                  className="btn btn-neutral btn-sm mt-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(stringifiedOutput);
                      alert("Copied to clipboard");
                    } catch (error) {
                      alert("Failed to copy to clipboard");
                    }
                  }}
                >
                  Copy Output
                </button>
              )}
            </>
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
