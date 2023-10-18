"use client";

import { RecipeMutationContentType } from "types/enums";
import { useRecipeSessionStore } from "../../../ui/state/recipeSession";
import { EditorParamView } from "./CodeEditors/common";
import {
  EditorViewWithSchema,
  EditorViewWithSchemaBody,
  InitializeSchema,
} from "./CodeEditors/EditorJSON";

import { EditorTypeScript } from "./CodeEditors/EditorTypeScript";
import { API_TYPE_NAMES } from "../../utils/constants/recipe";

export function EditorBody() {
  const editorBodyType = useRecipeSessionStore((state) => state.editorBodyType);
  const setEditorBodyType = useRecipeSessionStore(
    (state) => state.setEditorBodyType
  );

  return (
    <div className="flex-1 overflow-x-auto sm:block hidden z-20">
      {editorBodyType === null && false && (
        <select
          className="select select-bordered m-4 select-sm"
          onChange={(e) => {
            setEditorBodyType(
              (e.target.value || null) as RecipeMutationContentType
            );
          }}
        >
          <option value={undefined}>None</option>
          <option value={RecipeMutationContentType.JSON}>JSON Body</option>
          {/* <option value={RecipeMutationContentType.FormData}>
            FormData Body
          </option> */}
        </select>
      )}

      <JSONEditorContainer />
    </div>
  );
}

export const JSONEditorContainer = () => {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const editorBody = useRecipeSessionStore((state) => state.editorBody);
  const setEditorBody = useRecipeSessionStore((state) => state.setEditorBody);

  const editorBodySchemaType = useRecipeSessionStore(
    (state) => state.editorBodySchemaType
  );
  const setEditorBodySchemaType = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaType
  );

  const editorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.editorBodySchemaJSON
  );
  const setEditorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.setEditorBodySchemaJSON
  );

  return (
    <div className="grid grid-rows-2 flex-1 h-full z-20 overflow-x-auto">
      {editorBodySchemaJSON || editorBody ? (
        <EditorViewWithSchemaBody
          value={editorBody}
          setValue={setEditorBody}
          key={`${currentSession?.id || "default"}-json-body`}
          jsonSchema={editorBodySchemaJSON}
          typeName={API_TYPE_NAMES.APIRequestParams}
        />
      ) : (
        <InitializeSchema type={EditorParamView.Body} allowImport />
      )}
      {(editorBodySchemaJSON || editorBody) && (
        <EditorTypeScript
          // This key is important, it refreshes changes for us when we switch tabs
          key={`${currentSession?.id || "default"}-types-body`}
          schemaType={editorBodySchemaType}
          editorParamView={EditorParamView.Body}
          setSchemaJSON={setEditorBodySchemaJSON}
          setSchemaType={setEditorBodySchemaType}
          defaultExport={API_TYPE_NAMES.APIRequestParams}
        />
      )}
    </div>
  );
};
