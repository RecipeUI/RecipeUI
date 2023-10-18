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
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import { MARKDOWN_NEWLINES_REGEX, URL_PARAM_REGEX } from "utils/constants";

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

  const updateEditorBodySchemaJSON = useRecipeSessionStore(
    (state) => state.updateEditorBodySchemaJSON
  );
  const updateEditorQuerySchemaJSON = useRecipeSessionStore(
    (state) => state.updateEditorQuerySchemaJSON
  );

  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);

  const requestBody = bodySchema ? (
    <div className="py-4" id="docRequestBody">
      <h3 className="text-lg mb-4 font-bold text-black dark:text-white">
        Request Body
      </h3>
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
      <h3 className="text-lg mb-4 font-bold text-black dark:text-white">
        Query Params
      </h3>
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

  return (
    <div
      className={classNames(
        "sm:absolute inset-0 px-4 overflow-y-auto right-pane-bg pb-8 pt-8 "
        // loadingTemplate && "cursor-wait pointer-events-none"
      )}
    >
      <EditorHeader />
      <EditorURLDocs />
      {bodyRoute === RecipeBodyRoute.Query ? (
        <>
          {queryParams}
          {requestBody}
        </>
      ) : (
        <>
          {requestBody}
          {queryParams}
        </>
      )}
    </div>
  );
}

function EditorURLDocs() {
  const urlSchema = useRecipeSessionStore((state) => state.editorURLSchemaJSON);
  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);
  const matches = editorUrl.match(URL_PARAM_REGEX) || [];
  const updateEditorURLSchemaJSON = useRecipeSessionStore(
    (state) => state.updateEditorURLSchemaJSON
  );

  if (matches.length === 0 || !urlSchema) {
    return null;
  }

  return (
    <div className="py-4">
      <h3 className="text-lg mb-4 font-bold text-black dark:text-white">
        Url Params
      </h3>
      <DefinitionContext.Provider
        value={{
          definitions: urlSchema.definitions,
          updater: updateEditorURLSchemaJSON,
        }}
      >
        <ObjectDocContainer schema={urlSchema} path="" />
      </DefinitionContext.Provider>
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
  useEffect(() => {
    setTitle(editorHeader.title);
    setDescription(editorHeader.description);
  }, [editorHeader]);

  const currentSession = useRecipeSessionStore((state) => state.currentSession);

  const updateSessionName = useRecipeSessionStore(
    (state) => state.updateSessionName
  );

  return (
    <div className="mb-4">
      {!editing ? (
        <div
          className="cursor-pointer  text-black dark:text-white"
          onClick={() => {
            setEditing(true);
          }}
        >
          <h2 className="text-2xl font-bold flex items-center">
            {title}
            <PencilSquareIcon className="w-6 h-6 ml-2 mb-1" />
          </h2>
          <ReactMarkdown className="text-sm mt-1 recipe-md space-y-4">
            {description.replaceAll(MARKDOWN_NEWLINES_REGEX, "\n\n")}
          </ReactMarkdown>
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
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            className="btn btn-accent w-fit btn-sm"
            onClick={() => {
              if (currentSession) {
                updateSessionName(currentSession, title);
              }

              setEditorHeader({
                title,
                description: description.replaceAll(/(?<!\n)\n(?!\n)/g, "\n\n"),
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
        const childSchema = schema.properties![paramName] as JSONSchema6;
        if (childSchema && "$ref" in childSchema) {
          const objectDefinition = childSchema!["$ref"];
          if (!objectDefinition) return null;

          const referenceName = objectDefinition.split("#/definitions/").pop()!;
          const innerSchema = definitions![referenceName];

          if (typeof innerSchema == "boolean") return null;

          return (
            <ObjectDocContainer
              key={paramName}
              schema={innerSchema}
              path={`definitions.${referenceName}`}
            />
          );
        }

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

function getTypeLabel(schema: JSONSchema6) {
  let type: string = String(schema.type);
  if (schema.enum) {
    type = `${schema.type} | enum`;
  }

  if (schema.anyOf) {
    type = schema.anyOf
      .map((anyOf) => {
        const innerType = (anyOf as JSONSchema6).type;

        if (innerType === "array") {
          return `${getTypeLabel(
            (anyOf as JSONSchema6).items as JSONSchema6
          )}[]`;
        }

        return innerType;
      })
      .join(" | ");
  }

  return type;
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

  const [description, setDescription] = useState(definition.description || "");
  const [defaultValue, setDefaultValue] = useState<string | number | boolean>(
    definition.default as string
  );
  const [minNumber, setMinNumber] = useState(definition.minimum);
  const [maxNumber, setMaxNumber] = useState(definition.maximum);

  useEffect(() => {
    setDescription(definition.description || "");
    setDefaultValue(definition.default as string);
    setMinNumber(definition.minimum);
    setMaxNumber(definition.maximum);
  }, [paramName, definition]);

  const [editing, setEditing] = useState(false);
  const { updater } = useContext(DefinitionContext);
  const isPrimitive =
    typeof definition.type === "string" &&
    ["string", "number", "integer", "boolean"].includes(definition.type);

  return (
    <div
      className="border border-slate-200 dark:border-slate-600 rounded-sm p-4 text-black dark:text-white bg-base-200 dark:bg-transparent"
      key={paramName}
    >
      <div className="flex justify-between">
        <div className="space-x-4">
          <span className="font-bold">{paramName}</span>
          <span className="text-sm">{getTypeLabel(definition)}</span>
          <span
            className={classNames(
              "text-sm",
              required ? "text-red-600" : "text-black dark:text-white"
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
        <ReactMarkdown className="text-xs mt-2 cursor-pointer recipe-md space-y-4">
          {description.replaceAll(MARKDOWN_NEWLINES_REGEX, "\n\n")}
        </ReactMarkdown>
      ) : (
        <div className="space-y-2 flex flex-col py-4 text-black dark:text-gray-400">
          <EditDocFieldWrapper label="Description">
            <textarea
              className="textarea textarea-sm mt-1 w-full text-sm "
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="off"
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
                    autoComplete="off"
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
                  <select
                    className="select select-bordered w-full max-w-xs"
                    value={String(defaultValue)}
                    onChange={(e) => {
                      if (e.target.value === "true") {
                        setDefaultValue(true);
                      } else if (e.target.value === "false") {
                        setDefaultValue(false);
                      } else {
                        setDefaultValue("");
                      }
                    }}
                  >
                    <option value=""></option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
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
                  default:
                    defaultValueParsed !== "" ? defaultValueParsed : undefined,
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

      <div className="mt-2 italic">
        {typeof definition.default !== "undefined" && (
          <p className="text-xs">Default: {String(definition.default)}</p>
        )}
        {/* <p className="text-xs">Min: 5</p> */}
        {definition.enum && (
          <p className="text-xs">Enum: {definition.enum.join(", ")}</p>
        )}
        {(definition.minimum != undefined ||
          definition.maximum != undefined) && (
          <div className="flex space-x-2">
            {definition.minimum != undefined && (
              <p className="text-xs">Min: {definition.minimum}</p>
            )}
            {definition.maximum != undefined && (
              <p className="text-xs">Max: {definition.maximum}</p>
            )}
          </div>
        )}
      </div>
      {definition.anyOf && (
        <div>
          {definition.anyOf.map((anyOf, i) => {
            return (
              <div key={i} className="my-4">
                <ObjectDocContainer schema={anyOf as JSONSchema6} path={path} />
              </div>
            );
          })}
        </div>
      )}
      {items && !Array.isArray(items) ? (
        <div className="my-4">
          <ObjectDocContainer
            schema={items as JSONSchema6}
            path={`${path}.items`}
          />
        </div>
      ) : null}
      {definition.type === "object" &&
        definition.properties &&
        Object.keys(definition.properties).length > 0 && (
          <ObjectDocContainer
            path={`${path}.properties`}
            schema={definition as JSONSchema6}
          />
        )}
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
      <p className="text-xs font-bold text-black dark:text-white">{label}</p>
      {children}
    </div>
  );
}
