import { useLocalStorage } from "usehooks-ts";
import { ComponentModuleContainer } from "../components/ComponentModuleContainer";
import module from "./settings";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

export default function Module() {
  return (
    <ComponentModuleContainer
      module={module}
      moduleComponentMapping={{
        Custom2: <StreamingTip />,
      }}
    />
  );
}

export function StreamingTip() {
  const [showTip, setShowTip] = useLocalStorage("show-streaming-tip", true);

  if (!showTip) return null;

  return (
    <div className="border p-4 rounded-md">
      <h2 className="text-lg font-bold mb-4 relative">
        <span className="badge badge-accent rounded-md badge-lg mr-2">Tip</span>{" "}
        <span>Streaming on RecipeUI</span>
        <button
          className="absolute right-0 -top-1 cursor-pointer"
          onClick={() => {
            setShowTip(false);
          }}
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </h2>
      <p className="text-sm">
        When using the Chat Completion endpoint, you can use the "stream"
        property to stream the output on RecipeUI.
      </p>
      <img
        className="mt-2 rounded-md shadow-lg"
        src="https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/recipeui/tutorial/aistream.gif"
        alt="streaming-tip-gif"
      />
    </div>
  );
}
