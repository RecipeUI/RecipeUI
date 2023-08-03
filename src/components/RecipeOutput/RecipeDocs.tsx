import classNames from "classnames";
import {
  RecipeArrayParam,
  RecipeObjectParam,
  RecipeParam,
  RecipeParamType,
  RecipeVariedParam,
  isVariedParam,
} from "../../types/recipes";
import ReactMarkdown from "react-markdown";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { getDefaultValue, getValueInObjPath } from "../../utils/main";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function RecipeDocs() {
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe
  );
  const requestBody =
    "requestBody" in selectedRecipe ? selectedRecipe.requestBody : null;

  return (
    <div className="sm:absolute inset-0 px-4 py-6 overflow-y-auto">
      <h1 className="text-xl font-bold">{selectedRecipe.title}</h1>
      {selectedRecipe.summary && (
        <p className="mt-2">{selectedRecipe.summary}</p>
      )}
      {requestBody && "objectSchema" in requestBody && (
        <RecipeDocsContainer param={requestBody} paramPath="" />
      )}
    </div>
  );
}

function RecipeDocsContainer({
  param,
  paramPath,
}: {
  param: RecipeObjectParam;
  paramPath: string;
}) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const addedAlready: [string, RecipeParam][] = [];
  const remaining: [string, RecipeParam][] = [];

  for (const [propertyName, paramSchema] of Object.entries(
    param.objectSchema
  )) {
    if (requestBody[propertyName] !== undefined) {
      addedAlready.push([propertyName, paramSchema]);
    } else {
      remaining.push([propertyName, paramSchema]);
    }
  }

  return (
    <div className="my-4">
      {addedAlready.length > 0 && (
        <div
          className={classNames(remaining.length > 0 ? "mb-4" : "")}
          id="recipe-added"
        >
          {addedAlready.map(([propertyName, paramSchema]) => {
            return (
              <RecipeDocsParamContainer
                key={propertyName}
                paramName={propertyName}
                paramSchema={paramSchema}
                paramPath={paramPath + "." + propertyName}
              />
            );
          })}
        </div>
      )}
      {remaining.length > 0 && (
        <div>
          {remaining.map(([propertyName, paramSchema]) => {
            return (
              <RecipeDocsParamContainer
                key={propertyName}
                paramName={propertyName}
                paramSchema={paramSchema}
                paramPath={paramPath + "." + propertyName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function getParamTypes(schema: RecipeVariedParam) {
  // Need to make this a set to remove duplicates
  const types = new Set(schema.variants.map((variant) => variant.type));
  return Array.from(types);
}

function RecipeDocObjectDefinition({
  paramName,
  paramSchema,
  showRequired = true,
}: {
  paramName: string;
  paramSchema: RecipeParam;
  showRequired?: boolean;
}) {
  const required = Boolean(paramSchema.required);

  return (
    <>
      <div className="space-x-4">
        <span className="font-bold">{paramName}</span>
        <span className="text-sm">
          {"variants" in paramSchema
            ? getParamTypes(paramSchema).join(" or ")
            : paramSchema.type}
        </span>
        {showRequired && (
          <span
            className={classNames(
              "text-sm",
              required ? "text-red-600" : "text-gray-600"
            )}
          >
            {required ? "required" : "optional"}
          </span>
        )}
      </div>
      {paramSchema.type === RecipeParamType.Object && (
        <ArrayParamDocs
          objectSchema={paramSchema.objectSchema}
          hasParamState={false}
        />
      )}
    </>
  );
}

// I think this window is extra special, we shouldn't reuse it for objects
function RecipeDocsParamContainer({
  paramSchema,
  paramName,
  paramPath,
}: {
  paramSchema: RecipeParam;
  paramName: string;
  paramPath: string;
}) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );

  const paramState = getValueInObjPath(requestBody, paramPath);
  const isParamInBody = paramState !== undefined;

  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="border rounded-sm p-4" id={`${paramPath}`}>
      <div className="flex justify-between items-center">
        <RecipeDocObjectDefinition
          paramName={paramName}
          paramSchema={paramSchema}
        />

        <button
          ref={buttonRef}
          className={classNames("btn btn-sm", isParamInBody && "btn-error")}
          onClick={() => {
            if (isParamInBody) {
              updateRequestBody({ path: paramPath, value: undefined });
            } else {
              updateRequestBody({
                path: paramPath,
                value: getDefaultValue(paramSchema),
              });

              setTimeout(() => {
                document
                  .getElementById(paramPath)
                  ?.lastElementChild?.scrollIntoView({
                    behavior: "instant" as ScrollBehavior,
                    block: "center",
                  });
              }, 0); // Trick to wait for the DOM to update
            }
          }}
        >
          {isParamInBody ? "Remove" : "Add"}
        </button>
      </div>
      {paramSchema.description && (
        <ReactMarkdown
          className="text-sm mt-2"
          components={{
            a: (props) => <a {...props} className="text-blue-600 underline" />,
          }}
        >
          {paramSchema.description}
        </ReactMarkdown>
      )}
      {paramSchema.type === RecipeParamType.Array &&
        paramSchema.arraySchema.type === RecipeParamType.Object && (
          <ArrayParamDocs
            objectSchema={paramSchema.arraySchema.objectSchema}
            hasParamState={paramState !== undefined}
          />
        )}

      {/* I think variants are confusing to explain */}
      {/* {"variants" in paramSchema && (
        <VariedParamDocs paramSchema={paramSchema} />
      )} */}
      {paramState !== undefined && (
        <div className="mt-4">
          <RecipeDocParamEdit paramSchema={paramSchema} paramPath={paramPath} />
        </div>
      )}
    </div>
  );
}

// function VariedParamDocs({ paramSchema }: { paramSchema: RecipeVariedParam }) {
//   const [showDocs, setShowDocs] = useState(false);

//   const types = getParamTypes(paramSchema);

//   if (types.length === 1) {
//     return null;
//   }

//   const definition = (
//     <div className="my-2 flex justify-start flex-col">
//       {paramSchema.variants.map((variant, i) => {
//         return (
//           <div className="border rounded-sm p-4" key={variant.type}>
//             <RecipeDocObjectDefinition
//               paramName={`Variant ${i + 1}`}
//               paramSchema={variant}
//               showRequired={false}
//             />
//           </div>
//         );
//       })}
//     </div>
//   );

//   return (
//     <div
//       className="tooltip tooltip-right"
//       data-tip="This parameter has multiple"
//     >
//       <button
//         className="cursor-pointer text-sm text-gray-600 underline"
//         onClick={() => {
//           setShowDocs(!showDocs);
//         }}
//       >
//         {showDocs ? "Hide variant definitions" : "Show variant definitions"}
//       </button>
//       {showDocs && definition}
//     </div>
//   );
// }

function ArrayParamDocs({
  objectSchema,
}: // hasParamState,
{
  objectSchema: Record<string, RecipeParam>;
  hasParamState: boolean;
}) {
  // const [showArraySchema, setShowArraySchema] = useState(false);

  const definition = (
    <div className="my-2">
      {Object.keys(objectSchema).map((innerParamName) => {
        const innerParamSchema = objectSchema[innerParamName];

        return (
          <div className="border rounded-sm p-4" key={innerParamName}>
            <RecipeDocObjectDefinition
              key={innerParamName}
              paramName={innerParamName}
              paramSchema={innerParamSchema}
            />
            {innerParamSchema.description && (
              <ReactMarkdown
                className="text-sm mt-2"
                components={{
                  a: (props) => (
                    <a {...props} className="text-blue-600 underline" />
                  ),
                }}
              >
                {innerParamSchema.description}
              </ReactMarkdown>
            )}
          </div>
        );
      })}
    </div>
  );
  return definition;

  // I feel like we don't need to actually mask this
  // if (!hasParamState) {
  //   return definition;
  // }

  // return (
  //   <div>
  //     <button
  //       className="cursor-pointer text-sm text-gray-600"
  //       onClick={() => {
  //         setShowArraySchema(!showArraySchema);
  //       }}
  //     >
  //       {showArraySchema ? "Hide array definition" : "Show array definition"}
  //     </button>
  //     {showArraySchema && <div className="">{definition}</div>}
  //   </div>
  // );
}

interface RecipeDocParamEditProps {
  paramSchema: RecipeParam;
  paramPath: string;
}

function RecipeDocParamEdit({
  paramSchema,
  paramPath,
}: RecipeDocParamEditProps) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );

  const paramState = getValueInObjPath(requestBody, paramPath);

  if (paramSchema.type === RecipeParamType.String) {
    if (paramSchema.enum) {
      return (
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={paramState as string}
          onChange={(e) => {
            updateRequestBody({
              path: paramPath,
              value: e.target.value,
            });
          }}
        >
          {paramSchema.enum?.map((value) => {
            return <option key={value}>{value}</option>;
          })}
        </select>
      );
    }

    return (
      <textarea
        className="textarea textarea-bordered textarea-sm w-full"
        defaultValue={paramSchema.default}
        rows={1}
        value={paramState as string}
        onChange={(e) => {
          // TODO: This feels expensive
          updateRequestBody({
            path: paramPath,
            value: e.target.value,
          });
        }}
      />
    );
  } else if (paramSchema.type === RecipeParamType.Boolean) {
    return (
      <input
        type="checkbox"
        className="toggle"
        checked={paramState as boolean}
        onChange={(e) => {
          updateRequestBody({
            path: paramPath,
            value: e.target.checked,
          });
        }}
      />
    );
  } else if (
    paramSchema.type === RecipeParamType.Number ||
    paramSchema.type === RecipeParamType.Integer
  ) {
    // Do something special if minimum and maxmium are defined
    if (paramSchema.maximum != undefined && paramSchema.minimum != undefined) {
      return (
        <div className="space-x-4 flex items-center">
          <input
            type="range"
            min={paramSchema.minimum}
            max={paramSchema.maximum}
            value={paramState as number}
            onChange={(e) => {
              updateRequestBody({
                path: paramPath,
                value: Number(e.target.value),
              });
            }}
            step={paramSchema.type === RecipeParamType.Integer ? 1 : "0.01"}
            className="range range-xs w-32"
          />
          <span>{paramState as number}</span>
        </div>
      );
    }

    return (
      <input
        type="number"
        className="input input-sm input-bordered"
        defaultValue={paramSchema.default}
        value={paramState as number}
        onChange={(e) => {
          updateRequestBody({
            path: paramPath,
            value: Number(e.target.value),
          });
        }}
      />
    );
  } else if (isVariedParam(paramSchema.type) && "variants" in paramSchema) {
    return (
      <RecipeDocVariedParamEdit
        paramSchema={paramSchema}
        paramPath={paramPath}
      />
    );
  } else if (paramSchema.type === RecipeParamType.Array) {
    return (
      <RecipeDocArrayParam paramPath={paramPath} paramSchema={paramSchema} />
    );
  } else if (paramSchema.type === RecipeParamType.Object) {
    return (
      <RecipeDocObjectParam paramPath={paramPath} paramSchema={paramSchema} />
    );
  } else if (paramSchema.type === RecipeParamType.File) {
    return <RecipeFileParamEdit paramPath={paramPath} />;
  }

  return <EditInEditor />;
}

function RecipeFileParamEdit({ paramPath }: { paramPath: string }) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const fileManagerInfo = useRecipeSessionStore((state) => state.fileManager);
  const currentSession = useRecipeSessionStore(
    (state) => state.currentSession!
  );
  const updateFileInfo = useRecipeSessionStore(
    (state) => state.updateFileManager
  );
  const deleteFileInfo = useRecipeSessionStore(
    (state) => state.deleteFileManager
  );

  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );

  const fileInfo = fileManagerInfo[currentSession.id] as File | undefined;
  const paramState = getValueInObjPath(requestBody, paramPath) as
    | string
    | undefined;

  useEffect(() => {
    if (fileInfo === undefined && paramState !== undefined) {
      updateRequestBody({
        path: paramPath,
        value: null,
      });
    }
  }, []);

  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      updateRequestBody({
        path: paramPath,
        value: file?.name,
      });
      updateFileInfo(currentSession.id, file);
    }
  };

  return (
    <div className="flex space-x-2 items-center">
      {fileInfo && paramState ? (
        <div>
          <span className="mr-2 text-sm border border-dashed rounded-md p-2">
            {fileInfo.name}
          </span>
          <button
            className="btn btn-sm"
            onClick={() => {
              updateRequestBody({
                path: paramPath,
                value: null,
              });
              deleteFileInfo(currentSession.id);
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <input
          type="file"
          className="file-input file-input-bordered w-full max-w-xs file-input-sm"
          onChange={onUpload}
        />
      )}
      <div
        className="tooltip text-sm"
        data-tip="Files you upload are only available temporarily. We do not store anything locally or online."
      >
        Where is my file stored?
      </div>
    </div>
  );
}

function EditInEditor() {
  return (
    <div className="text-sm text-gray-600 alert">
      Edit this value in the editor
    </div>
  );
}

// TODO: For RecipeObjectParma, we need a way to show hidden keys...
function RecipeDocObjectParam({
  paramSchema,
  paramPath,
}: {
  paramSchema: RecipeObjectParam;
  paramPath: string;
}) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);

  const paramState =
    getValueInObjPath<Record<string, unknown>>(requestBody, paramPath) || {};

  if (Object.keys(paramSchema.objectSchema).length === 0) {
    return <EditInEditor />;
  }

  return (
    <div className="border border-dashed rounded p-4 space-y-2 w-full">
      {Object.keys(paramState).map((innerParamName) => {
        const innerParamSchema = paramSchema.objectSchema[innerParamName];
        return (
          <div
            key={innerParamName}
            className="flex min-w-52 flex-col space-y-2"
          >
            <div>{innerParamName}</div>
            <RecipeDocParamEdit
              paramSchema={innerParamSchema}
              paramPath={`${paramPath}.${innerParamName}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function RecipeDocArrayParam({
  paramSchema,
  paramPath,
}: {
  paramSchema: RecipeArrayParam;
  paramPath: string;
}) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );

  const paramState = getValueInObjPath<unknown[]>(requestBody, paramPath) || [];
  return (
    <div className="">
      <div
        className={classNames(
          paramState.length > 0 && "mb-2 space-y-2 border rounded-sm p-2"
        )}
      >
        {paramState?.map((_, index) => {
          // TODO: Not good for nested I think?
          return (
            <div key={index} className="flex items-center space-x-2 w-full">
              <RecipeDocParamEdit
                paramSchema={paramSchema.arraySchema}
                paramPath={`${paramPath}.[${index}]`}
              />
              <button
                className="btn btn-xs"
                onClick={() => {
                  const newParamState = [...paramState];
                  newParamState.splice(index, 1);

                  updateRequestBody({
                    path: paramPath,
                    value: newParamState.length > 0 ? newParamState : undefined,
                  });
                }}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
              {/* I have a feeling that these re-arrange buttons do more harm than good */}
              {/* {index !== paramState.length - 1 && (
                <button
                  className="btn btn-xs"
                  onClick={() => {
                    const newParamState = [...paramState];
                    const itemToMove = newParamState.splice(index, 1)[0];
                    newParamState.splice(index + 1, 0, itemToMove);
                    updateRequestBody({
                      path: paramPath,
                      value: newParamState,
                    });
                  }}
                >
                  <ArrowDownIcon className="w-3 h-3" />
                </button>
              )}
              {index !== 0 && (
                <button
                  className="btn btn-xs"
                  onClick={() => {
                    const newParamState = [...paramState];
                    const itemToMove = newParamState.splice(index, 1)[0];
                    newParamState.splice(index - 1, 0, itemToMove);
                    updateRequestBody({
                      path: paramPath,
                      value: newParamState,
                    });
                  }}
                >
                  <ArrowUpIcon className="w-3 h-3" />
                </button>
              )} */}
            </div>
          );
        })}
      </div>
      <div
        className="tooltip tooltip-right"
        data-tip="This parameter expects a list of items. Clicking add will add a new array item."
      >
        <button
          className="btn btn-neutral btn-sm"
          onClick={() => {
            const defaultParam = getDefaultValue(paramSchema.arraySchema);

            updateRequestBody({
              path: paramPath,
              value: [...paramState, defaultParam],
            });
          }}
        >
          Add new item
        </button>
      </div>
    </div>
  );
}

function RecipeDocVariedParamEdit({
  paramSchema,
  paramPath,
}: {
  paramSchema: RecipeVariedParam;
  paramPath: string;
}) {
  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );

  const [primaryVariantIndex, setPrimaryVariantIndex] = useState(0);

  const paramTypes = getParamTypes(paramSchema);

  // This is the best index to use for the enum
  const enumVariantIndex = paramSchema.variants.findIndex(
    (variant) => "enum" in variant
  );

  // This edge case is very overkill UX optimization. Essentially this covers the case where the user can select
  // a list of options ["a", "b", "c", "d"] or put in their own option.
  // In most cases, the user should should choose from the list rather than do their own
  if (
    paramTypes.length === 1 &&
    paramSchema.type === RecipeParamType.AnyOf &&
    enumVariantIndex !== -1
  ) {
    const enumVariant = paramSchema.variants[enumVariantIndex];
    return (
      <RecipeDocParamEdit
        // @ts-expect-error the type here is wrong
        paramSchema={{
          ...paramSchema,
          type: paramTypes[0] as unknown as RecipeParamType,
          enum: "enum" in enumVariant ? enumVariant.enum : undefined,
        }}
        paramPath={paramPath}
      />
    );
  }

  // We need to cycle between different variants. How do we do that? we can show dropdown

  const primaryVariant = paramSchema.variants[primaryVariantIndex];

  return (
    <div className="">
      <RecipeDocParamEdit paramPath={paramPath} paramSchema={primaryVariant} />
      <div
        className={classNames(
          "tooltip tooltip-right",
          primaryVariant.type === RecipeParamType.Array ? "mt-2" : "mt-2"
        )}
        data-tip="This parameter can take different types."
      >
        <button
          className="btn btn-sm"
          onClick={() => {
            const newVariantIndex =
              (primaryVariantIndex + 1) % paramSchema.variants.length;

            setPrimaryVariantIndex(newVariantIndex);

            // We're gonna have to reset the default value here
            const nextVariant = paramSchema.variants[newVariantIndex];
            updateRequestBody({
              path: paramPath,
              value: getDefaultValue(nextVariant),
            });
          }}
        >
          Change Variant
        </button>
      </div>
    </div>
  );

  // paramSchema
  // We need to do something special here for model
}
