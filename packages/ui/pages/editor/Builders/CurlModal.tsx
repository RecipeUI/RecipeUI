"use client";
import classNames from "classnames";
import { useState } from "react";
import {
  EditorSliceValues,
  RecipeSession,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Modal } from "../../../components/Modal";
import { parseCurl } from "../curlParser";
import { RecipeAuthType, RecipeMethod } from "types/enums";
import { v4 as uuidv4 } from "uuid";
import {
  API_LOCAL_PROCESSING_URLS,
  API_TYPE_NAMES,
} from "../../../utils/constants/main";
import { getQueryAndBodyInfo } from "./helpers";

export function CurlModal({ onClose }: { onClose: () => void }) {
  const [curlString, setCurlString] = useState("");
  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const requestInfo = parseCurl(curlString);

      const editorSlice: Partial<EditorSliceValues> = {
        editorUrl: requestInfo.url.split("?")[0],
        editorBody: requestInfo.body
          ? JSON.stringify(requestInfo.body, null, 2)
          : "",
        editorHeaders: Object.keys(requestInfo.headers).map((key) => ({
          name: key,
          value: requestInfo.headers[key],
        })),
        editorMethod: requestInfo.method.toUpperCase() as RecipeMethod,
      };

      const { queryInfo, bodyInfo } = await getQueryAndBodyInfo({
        url: requestInfo.url,
        body: requestInfo.body,
      });

      if (queryInfo) {
        editorSlice.editorQuerySchemaType = queryInfo.editorQuerySchemaType;
        editorSlice.editorQuerySchemaJSON = queryInfo.editorQuerySchemaJSON;
      }

      if (bodyInfo) {
        editorSlice.editorBodySchemaType = bodyInfo.editorBodySchemaType;
        editorSlice.editorBodySchemaJSON = bodyInfo.editorBodySchemaJSON;

        editorSlice.editorMethod = RecipeMethod.POST;
      }

      if (editorSlice.editorHeaders) {
        for (const header of editorSlice.editorHeaders) {
          if (header.name === "Authorization") {
            if (header.value.startsWith("Bearer")) {
              editorSlice.editorAuth = {
                type: RecipeAuthType.Bearer,
              };

              break;
            }
          }
        }

        if (editorSlice.editorAuth) {
          editorSlice.editorHeaders = editorSlice.editorHeaders.filter(
            (header) => header.name !== "Authorization"
          );
        }
      }

      const newSession: RecipeSession = {
        id: uuidv4(),
        name: "New Session",
        apiMethod: editorSlice.editorMethod || RecipeMethod.GET,
        recipeId: uuidv4(),
      };

      setTimeout(() => {
        initializeEditorSession({
          currentSession: newSession,
          ...editorSlice,
        });
        onClose();
      }, 0);
    } catch (err) {
      console.error(err);
      setError("Could not parse CURL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} header="Import from CURL">
      <div className="mt-2 space-y-4">
        <p>{"Enter your cURL code snippet below and we'll try to parse it."}</p>
        {error && <div className="text-red-500 text-sm font-bold">{error}</div>}
        <textarea
          rows={8}
          className={classNames(
            "textarea  w-full",
            error ? "textarea-error" : "textarea-accent"
          )}
          value={curlString}
          onChange={(e) => setCurlString(e.target.value)}
        />
        {loading ? (
          <span className="loading  loading-lg loading-bars"></span>
        ) : (
          <button className="btn btn-accent btn-sm" onClick={onSubmit}>
            Submit
          </button>
        )}
      </div>
    </Modal>
  );
}
