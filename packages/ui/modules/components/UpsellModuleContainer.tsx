"use client";
import {
  RecipeBodyRoute,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { Modal } from "../../components/Modal";
import { ModuleSetting } from "..";
import { ComponentModuleContainer } from "./ComponentModuleContainer";

export function UpsellModuleContainer({ module }: { module: ModuleSetting }) {
  const setEditorProject = useRecipeSessionStore(
    (state) => state.setEditorProject
  );

  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const setEditorSessionOptions = useRecipeSessionStore(
    (state) => state.setEditorSessionOptions
  );

  return (
    <Modal header={`Import ${module.title} module?`}>
      <div className="">
        <div className="border m-4 mb-0 p-4 rounded-md">
          <button
            className="btn btn-accent btn-sm"
            onClick={() => {
              setEditorProject(module.module);
              setBodyRoute(RecipeBodyRoute.Collection);
            }}
          >
            Import
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setEditorSessionOptions({
                ignoreProject: module.module,
              });
            }}
          >
            Decline
          </button>
        </div>
        <ComponentModuleContainer module={module} />
      </div>
    </Modal>
  );
}
