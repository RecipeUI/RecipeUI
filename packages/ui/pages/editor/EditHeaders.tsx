"use client";

import { useEffect, useState } from "react";
import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { useDebounce } from "usehooks-ts";
import { produce } from "immer";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function EditHeaders() {
  const editorHeaders = useRecipeSessionStore((state) => state.editorHeaders);
  const setEditorHeaders = useRecipeSessionStore(
    (state) => state.setEditorHeaders
  );

  const [headers, setHeaders] = useState(editorHeaders);

  const debouncedHeaders = useDebounce(headers, 500);
  useEffect(() => {
    setEditorHeaders(debouncedHeaders);
  }, [debouncedHeaders]);

  return (
    <div className="flex-1 overflow-x-auto sm:block hidden z-20 p-4">
      {headers.length > 0 && (
        <div className="space-y-2 mb-4">
          {headers.map(({ name, value }, index) => {
            return (
              <div
                className="flex border rounded-sm overflow-clip text-sm"
                key={index}
              >
                <input
                  className="p-3 border-r bg-base-300 flex-1"
                  placeholder="Header"
                  value={name}
                  onChange={(e) => {
                    setHeaders(
                      produce(headers, (draft) => {
                        draft[index].name = e.target.value;
                      })
                    );
                  }}
                />
                <input
                  className="p-3 bg-base-300 flex-1"
                  placeholder="Value"
                  value={value}
                  onChange={(e) => {
                    setHeaders(
                      produce(headers, (draft) => {
                        draft[index].value = e.target.value;
                      })
                    );
                  }}
                />
                <button
                  className="px-4 bg-base-300 hover:bg-error border-l"
                  onClick={() => {
                    setHeaders(headers.filter((_, i) => i !== index));
                  }}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button
        className="btn btn-accent"
        onClick={() => {
          setHeaders([
            ...headers,
            {
              name: "",
              value: "",
            },
          ]);
        }}
      >
        Add header
      </button>
    </div>
  );
}
