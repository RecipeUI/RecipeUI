import classNames from "classnames";

import { useRecipeSessionStore } from "../../state/recipeSession";
import { ReactNode, useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { JSONSchema6 } from "json-schema";

export function RecipeEditDocs() {
  const schema = useRecipeSessionStore((state) => state.editorBodySchemaJSON);

  return (
    <div
      className={classNames(
        "sm:absolute inset-0 px-4 overflow-y-auto bg-gray-800 dark:bg-gray-700"
        // loadingTemplate && "cursor-wait pointer-events-none"
      )}
    >
      <div className="my-4">
        <h3 className="text-xl mb-4 font-bold">Request Body</h3>
        <ObjectDocContainer definition={schema} path="" />
      </div>

      <pre>
        <code>{JSON.stringify(schema, null, 2)}</code>
      </pre>
    </div>
  );
}

function ObjectDocContainer({
  definition,
  path,
}: {
  definition: JSONSchema6;
  path: string;
}) {
  if (!definition.properties) {
    return <></>;
  }

  return (
    <>
      {Object.keys(definition.properties).map((paramName) => {
        const required =
          definition.required && definition.required.includes(paramName);

        return (
          <DocContainer
            key={paramName}
            paramName={paramName}
            definition={definition.properties![paramName] as JSONSchema6}
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
  const updateEditorBodySchemaJson = useRecipeSessionStore(
    (state) => state.updateEditorBodySchemaJSON
  );

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
        <div className="space-y-2 flex flex-col py-4">
          <EditDocFieldWrapper label="Description">
            <textarea
              className="textarea textarea-sm mt-1 w-full text-sm"
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

              updateEditorBodySchemaJson({
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
            definition={items as JSONSchema6}
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
      <p className="text-xs font-bold">{label}</p>
      {children}
    </div>
  );
}
