import classNames from "classnames";

import {
  RecipeBodyRoute,
  RecipeEditorSlice,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { JSONSchema6 } from "json-schema";

const DefinitionContext = createContext<{
  definitions: JSONSchema6["definitions"];
  updater: RecipeEditorSlice["updateEditorBodySchemaJSON"];
}>({
  definitions: undefined,
  updater: {} as RecipeEditorSlice["updateEditorBodySchemaJSON"],
});

export function RecipeEditDocs() {
  const bodySchema = useRecipeSessionStore(
    (state) => state.editorBodySchemaJSON
  );
  const querySchema = useRecipeSessionStore(
    (state) => state.editorQuerySchemaJSON
  );
  const urlSchema = useRecipeSessionStore((state) => state.editorURLSchemaJSON);

  const updateEditorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.updateEditorBodySchemaJSON
  );
  const updateEditorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.updateEditorQuerySchemaJSON
  );

  const updateEditorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.updateEditorURLSchemaJSON
  );

  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);

  const requestBody = bodySchema ? (
    <div className="py-4" id="docRequestBody">
      <h3 className="text-lg mb-4 font-bold">Request Body</h3>
      <DefinitionContext.Provider
        value={{
          definitions: bodySchema.definitions,
          updater: updateEditorBodySchemaJSON,
        }}
      >
        <ObjectDocContainer schema={bodySchema} path="" />
      </DefinitionContext.Provider>
    </div>
  ) : null;

  const queryParams = querySchema ? (
    <div className="py-4" id="docQueryBody">
      <h3 className="text-lg mb-4 font-bold">Query Params</h3>
      <DefinitionContext.Provider
        value={{
          definitions: querySchema.definitions,
          updater: updateEditorQuerySchemaJSON,
        }}
      >
        <ObjectDocContainer schema={querySchema} path="" />
      </DefinitionContext.Provider>
    </div>
  ) : null;

  const urlParams = urlSchema ? (
    <div className="py-4" id="docQueryBody">
      <h3 className="text-lg mb-4 font-bold">Url Params</h3>
      <DefinitionContext.Provider
        value={{
          definitions: urlSchema.definitions,
          updater: updateEditorQuerySchemaJSON,
        }}
      >
        <ObjectDocContainer schema={urlSchema} path="" />
      </DefinitionContext.Provider>
    </div>
  ) : null;

  return (
    <div
      className={classNames(
        "sm:absolute inset-0 px-4 overflow-y-auto bg-gray-800 dark:bg-gray-700 pb-8 pt-4  text-gray-200 dark:text-gray-400"
        // loadingTemplate && "cursor-wait pointer-events-none"
      )}
    >
      <EditorHeader />
      {bodyRoute === RecipeBodyRoute.Query ? (
        <>
          {urlParams}
          {queryParams}
          {requestBody}
        </>
      ) : (
        <>
          {urlParams}
          {requestBody}
          {queryParams}
        </>
      )}
    </div>
  );
}

function EditorHeader() {
  const editorHeader = useRecipeSessionStore((state) => state.editorHeader);
  const setEditorHeader = useRecipeSessionStore(
    (state) => state.setEditorHeader
  );
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(editorHeader.title);
  const [description, setDescription] = useState(editorHeader.description);

  return (
    <div className="mb-4">
      {!editing ? (
        <div
          className="cursor-pointer dark:text-white"
          onClick={() => {
            setEditing(true);
          }}
        >
          <h2 className="text-2xl font-bold flex items-center">
            {title}
            <PencilSquareIcon className="w-6 h-6 ml-2 mb-1" />
          </h2>
          <p className="text-sm mt-1">{description}</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            className="input input-bordered text-black dark:text-gray-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="textarea textarea-sm textarea-bordered  text-black dark:text-gray-400"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            className="btn btn-accent w-fit btn-sm"
            onClick={() => {
              setEditorHeader({
                title,
                description,
              });
              setEditing(false);
            }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function ObjectDocContainer({
  schema,
  path,
}: {
  schema: JSONSchema6;
  path: string;
}) {
  const { definitions } = useContext(DefinitionContext);

  if (schema && "$ref" in schema) {
    const objectDefinition = schema!["$ref"];
    if (!objectDefinition) return null;

    const referenceName = objectDefinition.split("#/definitions/").pop()!;
    const innerSchema = definitions![referenceName];

    if (typeof innerSchema == "boolean") return null;

    return (
      <ObjectDocContainer
        schema={innerSchema}
        path={`definitions.${referenceName}`}
      />
    );
  }

  if (!schema?.properties) {
    return <></>;
  }

  return (
    <>
      {Object.keys(schema.properties).map((paramName) => {
        const required = schema.required && schema.required.includes(paramName);

        return (
          <DocContainer
            key={paramName}
            paramName={paramName}
            definition={schema.properties![paramName] as JSONSchema6}
            required={!!required}
            path={
              path
                ? `${path}.properties.${paramName}`
                : `properties.${paramName}`
            }
          />
        );
      })}
    </>
  );
}

function DocContainer({
  paramName,
  definition,
  required,
  path,
}: {
  paramName: string;
  definition: JSONSchema6;
  required: boolean;
  path: string;
}) {
  const items = definition.items;

  let type: string = String(definition.type);
  if (definition.enum) {
    type = `${definition.type} enum`;
  }

  const [description, setDescription] = useState(definition.description || "");
  const [defaultValue, setDefaultValue] = useState<string | number | boolean>(
    definition.default as string
  );
  const [minNumber, setMinNumber] = useState(definition.minimum);
  const [maxNumber, setMaxNumber] = useState(definition.maximum);

  const [editing, setEditing] = useState(false);
  const { updater } = useContext(DefinitionContext);
  const isPrimitive =
    typeof definition.type === "string" &&
    ["string", "number", "integer", "boolean"].includes(definition.type);

  return (
    <div
      className="border border-slate-200 dark:border-slate-600 rounded-sm p-4"
      key={paramName}
    >
      <div className="flex justify-between">
        <div className="space-x-4">
          <span className="font-bold">{paramName}</span>
          <span className="text-sm">{type}</span>
          <span
            className={classNames(
              "text-sm",
              required ? "text-red-600" : "text-gray-600"
            )}
          >
            {required ? "required" : "optional"}
          </span>
        </div>
        {!editing && (
          <button
            className=""
            onClick={() => {
              setEditing(true);
            }}
          >
            <PencilSquareIcon className="w-5 h-5 mb-1" />
          </button>
        )}
      </div>
      {!editing ? (
        <p className="text-xs mt-2 flex items-center cursor-pointer">
          {description || "Add a description"}{" "}
        </p>
      ) : (
        <div className="space-y-2 flex flex-col py-4 text-black dark:text-gray-400">
          <EditDocFieldWrapper label="Description">
            <textarea
              className="textarea textarea-sm mt-1 w-full text-sm "
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </EditDocFieldWrapper>
          {isPrimitive && (
            <>
              <EditDocFieldWrapper label="Default Value">
                {definition.type === "string" && (
                  <input
                    type="text"
                    className="input input-sm mt-1"
                    placeholder="(Optional)"
                    value={defaultValue as string}
                    onChange={(e) => setDefaultValue(e.target.value)}
                  />
                )}
                {(definition.type === "number" ||
                  definition.type === "integer") && (
                  <input
                    type="number"
                    className="input input-sm mt-1"
                    placeholder="(Optional)"
                    value={defaultValue as string}
                    onChange={(e) => setDefaultValue(e.target.value)}
                  />
                )}
                {definition.type === "boolean" && (
                  <input
                    type="checkbox"
                    className="toggle toggle-sm  mt-1"
                    placeholder="(Optional)"
                    checked={!!defaultValue}
                    value={defaultValue as string}
                    onChange={(e) => setDefaultValue(e.target.checked)}
                  />
                )}
              </EditDocFieldWrapper>
              {(definition.type === "number" ||
                definition.type === "integer") && (
                <>
                  <EditDocFieldWrapper label="Minimum Value">
                    <input
                      type="number"
                      className="input input-sm mt-1"
                      value={minNumber}
                      onChange={(e) => {
                        setMinNumber(
                          e.target.value !== ""
                            ? Number(e.target.value)
                            : undefined
                        );
                      }}
                    />
                  </EditDocFieldWrapper>
                  <EditDocFieldWrapper label="Maximum Value">
                    <input
                      type="number"
                      className="input input-sm mt-1"
                      value={maxNumber}
                      onChange={(e) =>
                        setMaxNumber(
                          e.target.value !== ""
                            ? Number(e.target.value)
                            : undefined
                        )
                      }
                    />
                  </EditDocFieldWrapper>
                </>
              )}
            </>
          )}
          <button
            className="btn btn-xs btn-accent w-fit !mt-4"
            onClick={() => {
              setEditing(false);

              let defaultValueParsed = defaultValue;

              if (defaultValueParsed) {
                if (
                  definition.type === "number" ||
                  definition.type === "integer"
                ) {
                  defaultValueParsed = Number(defaultValue);
                }
              }

              updater({
                path: path,
                update: {
                  description: description || undefined,
                  default: defaultValueParsed || undefined,
                  minimum: minNumber !== undefined ? minNumber : undefined,
                  maximum: maxNumber !== undefined ? maxNumber : undefined,
                },
                merge: true,
              });
            }}
          >
            Save
          </button>
        </div>
      )}

      <div className="mt-2">
        {definition.default && (
          <p className="text-xs">Default: {String(definition.default)}</p>
        )}
        {/* <p className="text-xs">Min: 5</p> */}
        {definition.enum && (
          <p className="text-xs">Enum: {definition.enum.join(", ")}</p>
        )}
        {(definition.minimum || definition.maximum) && (
          <div className="flex space-x-2">
            {definition.minimum && (
              <p className="text-xs">Min: {definition.minimum}</p>
            )}
            {definition.maximum && (
              <p className="text-xs">Max: {definition.maximum}</p>
            )}
          </div>
        )}
      </div>
      {items && !Array.isArray(items) ? (
        <div className="my-4">
          <ObjectDocContainer
            schema={items as JSONSchema6}
            path={`${path}.items`}
          />
        </div>
      ) : null}
    </div>
  );
}

function EditDocFieldWrapper({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-200 dark:text-gray-400">
        {label}
      </p>
      {children}
    </div>
  );
}
