"use client";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { CurlModal } from "../../pages/editor/Builders/CurlModal";
import { ViewCollectionModal } from "./Modal/ViewCollectionModal";
import { FolderModal } from "./Modal/FolderModal";

export function SidebarHeader() {
  const [curlModal, setCurlModal] = useState(false);
  const [viewCollectionModal, setViewCollectionModal] = useState(false);
  const [addFolderModal, setAddFolderModal] = useState(false);

  const addEditorSession = useRecipeSessionStore(
    (state) => state.addEditorSession
  );

  return (
    <>
      <div className="dropdown cursor-pointer w-full right-0 text-start border-b border-recipe-slate mb-2">
        <label
          tabIndex={0}
          className="cursor-pointer flex justify-start items-center  h-full px-2 text-xs text-start ml-2 py-4 font-bold"
        >
          New
          <PlusCircleIcon className="w-3 h-3 ml-1" />
        </label>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content  shadow z-10  rounded-lg bg-white dark:bg-slate-600 w-fit border left-2 top-8 text-end text-sm dark:text-white text-black"
          onClick={(e) => {
            // @ts-expect-error Need to get blur
            e.target.parentNode?.parentNode?.blur();

            setTimeout(() => {
              document.getElementById("url-input")?.focus();
            }, 500);
          }}
        >
          <li>
            <button
              onClick={(e) => {
                addEditorSession();
              }}
            >
              Request
            </button>
          </li>
          <li className="">
            <button
              className=""
              onClick={() => {
                setAddFolderModal(true);
              }}
            >
              Folder
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setCurlModal(true);
              }}
            >
              Import from cURL
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setViewCollectionModal(true);
              }}
            >
              Import collection
            </button>
          </li>
        </ul>

        {curlModal && <CurlModal onClose={() => setCurlModal(false)} />}
        {viewCollectionModal && (
          <ViewCollectionModal onClose={() => setViewCollectionModal(false)} />
        )}
        {addFolderModal && (
          <FolderModal onClose={() => setAddFolderModal(false)} />
        )}
      </div>
    </>
  );
}
