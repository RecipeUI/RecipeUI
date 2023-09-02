import classNames from "classnames";
import {
  RecipeContext,
  SessionOutput,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { ReactNode, useContext, useMemo, useRef } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import CodeMirror from "@uiw/react-codemirror";
import { useDarkMode } from "usehooks-ts";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { Recipe, RecipeOutputType } from "types/database";
import { useOutput } from "../../state/apiSession";

const codeMirrorSetup = {
  lineNumbers: true,
  highlightActiveLine: false,
};

export function RecipeOutputConsole() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const sessionOutput = useOutput(currentSession?.id);
  const {
    output: { output, type },
  } = sessionOutput;

  const { isDarkMode } = useDarkMode();
  const isSending = useRecipeSessionStore((state) => state.isSending);
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const selectedRecipe = useContext(RecipeContext);
  const { imageBlocks, codeBlocks } = useMemo(() => {
    // Even though we can match on this, it's not good because stringify removes some whitespace
    const codeBlockRegex = /```(.*?)```/gs;
    const imageRegex =
      /(https?:\/\/[^\s'"]+\.(png|jpg|jpeg|gif|bmp|webp)(\?[^\s'"]*)?)/gi;

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

  return (
    <div className="sm:absolute inset-0 px-4 py-6 overflow-y-auto bg-gray-800 dark:bg-gray-700 text-white space-y-6">
      {imageBlocks.length > 0 && (
        <>
          <OutputModule
            title="Images Found"
            tooltip="We found these image URLs from the response."
            loading={!!loadingTemplate}
            body={
              <>
                {imageBlocks.length > 1 && (
                  <p className="mb-2">
                    We found {imageBlocks.length} images. Scroll left and right
                    to see some of them.
                  </p>
                )}
                <div className="carousel rounded-box">
                  {imageBlocks.map((imageUrl, i) => {
                    if (i > 30) return null;

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
          loading={!!loadingTemplate}
          tooltip="We found these code snippets from the response."
          body={
            <div
              className={classNames(
                loadingTemplate ? "flex flex-col-reverse gap-y-4" : "space-y-4"
              )}
            >
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
      {!isSending || (isSending && type === RecipeOutputType.Streaming) ? (
        <>
          <OutputModule
            title="Response"
            body={
              Object.keys(output).length > 0 ? (
                <ResponseOutput
                  sessionOutput={sessionOutput.output}
                  selectedRecipe={selectedRecipe}
                />
              ) : null
            }
          />
        </>
      ) : (
        <div className="flex items-end mb-2">
          <h1 className="text-xl font-bold">Fetching response</h1>
          <span className="loading loading-bars loading-md  ml-2"></span>
        </div>
      )}
    </div>
  );
}

function ResponseOutput({
  selectedRecipe,
  sessionOutput,
}: {
  selectedRecipe?: Recipe | null;
  sessionOutput: SessionOutput;
}) {
  const extensions = useMemo(() => {
    if (
      selectedRecipe?.options?.streaming ||
      sessionOutput.contentType?.includes("text")
    ) {
      return [markdown()];
    } else {
      return [json()];
    }
  }, [selectedRecipe?.options?.streaming, sessionOutput.contentType]);

  const output = useMemo(() => {
    let _output = "";

    if (selectedRecipe?.options?.streaming) {
      if (sessionOutput.output["content"] as string) {
        _output = sessionOutput.output["content"] as string;
      } else {
        _output = JSON.stringify(_output, null, 2);
      }
    } else if (sessionOutput.contentType?.includes("text")) {
      _output = sessionOutput.output["text"] as string;
    } else {
      _output = JSON.stringify(sessionOutput.output, null, 2);
    }

    return _output;
  }, [
    selectedRecipe?.options?.streaming,
    sessionOutput.contentType,
    sessionOutput.output,
  ]);

  return (
    <CodeMirror
      readOnly={true}
      value={output}
      className="h-full !outline-none border-none max-w-sm sm:max-w-none"
      basicSetup={codeMirrorSetup}
      theme={"dark"}
      extensions={extensions}
    />
  );
}

function OutputModule({
  title,
  body,
  tooltip,
  loading,
}: {
  title: string;
  body: ReactNode;
  tooltip?: string;
  loading?: boolean;
}) {
  return (
    <div className="">
      <div className="flex items-center mb-2">
        <h1 className="text-xl font-bold">{title}</h1>
        {tooltip && (
          <span
            className="tooltip tooltip-bottom tooltip-accent ml-2"
            data-tip={tooltip}
          >
            <InformationCircleIcon className="w-5 h-5" />
          </span>
        )}
        {loading && <span className="loading loading-bars ml-2"></span>}
      </div>
      {body}
    </div>
  );
}
