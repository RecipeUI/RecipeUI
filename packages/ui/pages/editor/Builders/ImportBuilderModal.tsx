"use client";
import classNames from "classnames";
import { useState } from "react";
import {
  EditorSliceValues,
  RecipeSession,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Modal } from "../../../components/Modal";
import { RecipeMethod } from "types/enums";
import { v4 as uuidv4 } from "uuid";
import { useForm } from "react-hook-form";
import { FormLabelWrapper } from "../../../components/Navbar/FormLabelWrapper";
import { getQueryAndBodyInfo } from "./helpers";

export function ImportBuilderModal({
  onClose,
  initialUrl,
}: {
  onClose: () => void;
  initialUrl: string;
}) {
  const currentSession = useRecipeSessionStore(
    (state) => state.currentSession
  )!;

  const initializeEditorSession = useRecipeSessionStore(
    (state) => state.initializeEditorSession
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    url: string;
    method: RecipeMethod;
    body?: string;
  }>({
    defaultValues: {
      url: initialUrl,
    },
  });

  const onSubmit = handleSubmit(async (requestInfo) => {
    setError(null);
    setLoading(true);

    try {
      let editorSlice: Partial<EditorSliceValues> = {
        editorUrl: requestInfo.url.split("?")[0],
        editorBody: requestInfo.body
          ? JSON.stringify(requestInfo.body, null, 2)
          : "",
        editorMethod: requestInfo.method.toUpperCase() as RecipeMethod,
      };

      const { queryInfo, bodyInfo } = await getQueryAndBodyInfo({
        url: requestInfo.url,
        body: requestInfo.body,
      });

      editorSlice = {
        ...editorSlice,
        ...queryInfo,
        ...bodyInfo,
      };

      const newSession: RecipeSession = {
        ...currentSession,
        apiMethod: editorSlice.editorMethod || RecipeMethod.GET,
      };

      setTimeout(() => {
        initializeEditorSession({
          currentSession: newSession,
          ...editorSlice,
        });
        onClose();
      }, 0);
    } catch (err) {
      setError("Could not parse url");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Modal onClose={onClose} header="Import Builder">
      <form className="mt-2 space-y-4" onSubmit={onSubmit}>
        <p>
          Enter any information about your URL below and we will try to infer
          some types for you.
        </p>
        {error && <div className="text-red-500 text-sm font-bold">{error}</div>}

        <FormLabelWrapper label="URL">
          <input
            type="text"
            className="input input-sm input-bordered w-full input-accent"
            {...register("url", { required: true })}
          />
        </FormLabelWrapper>

        <FormLabelWrapper label="Method">
          <select
            className="select select-sm select-accent"
            {...register("method", { required: true })}
          >
            <option value={RecipeMethod.GET}>GET</option>
            <option value={RecipeMethod.POST}>POST</option>
            <option value={RecipeMethod.PUT}>PUT</option>
            <option value={RecipeMethod.PATCH}>PATCH</option>
            <option value={RecipeMethod.DELETE}>DELETE</option>
          </select>
        </FormLabelWrapper>

        <FormLabelWrapper label="Request Body (Optional)">
          <p>
            {
              "Use this if you want us to generate the types for your request body"
            }
          </p>
          <textarea
            rows={4}
            className={classNames(
              "textarea  w-full",
              error ? "textarea-error" : "textarea-accent"
            )}
            {...register("body", { required: false })}
          />
        </FormLabelWrapper>

        {loading ? (
          <span className="loading  loading-lg loading-bars"></span>
        ) : (
          <button className="btn btn-accent btn-sm" type="submit">
            Submit
          </button>
        )}
      </form>
    </Modal>
  );
}
