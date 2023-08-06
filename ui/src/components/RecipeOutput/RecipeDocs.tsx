import classNames from "classnames";
import {
  RecipeArrayParam,
  RecipeCore,
  RecipeObjectParam,
  RecipeObjectSchemas,
  RecipeParam,
  RecipeParamType,
  RecipeVariedParam,
  isVariedParam,
} from "@/types/databaseExtended";
import ReactMarkdown from "react-markdown";
import { useRecipeSessionStore } from "../../state/recipeSession";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultValue, getValueInObjPath } from "../../utils/main";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function RecipeDocs() {
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe
  );

  const requestBody =
    "requestBody" in selectedRecipe ? selectedRecipe.requestBody : null;
  const queryParams =
    "queryParams" in selectedRecipe ? selectedRecipe.queryParams : null;

  const urlParams =
    "urlParams" in selectedRecipe ? selectedRecipe.urlParams : null;

  return (
    <div className="sm:absolute inset-0 px-4 py-6 overflow-y-auto">
      <h1 className="text-xl font-bold">{selectedRecipe.title}</h1>
      {selectedRecipe.summary && (
        <ReactMarkdown className="mt-2 recipe-md">
          {selectedRecipe.summary}
        </ReactMarkdown>
      )}
      {requestBody && "objectSchema" in requestBody && (
        <RecipeDocsContainer param={requestBody} paramPath="" />
      )}
      {queryParams && <RecipeQueryDocsContainer queryParams={queryParams} />}
      {urlParams && <RecipeUrlDocsContainer urlParamsSchema={urlParams} />}
    </div>
  );
}

function RecipeQueryDocsContainer({
  queryParams,
}: {
  queryParams: RecipeObjectSchemas;
}) {
  return (
    <div className="my-4">
      {queryParams.map((paramSchema) => {
        const paramName = paramSchema.name;
        return (
          <RecipeDocsParamContainer
            key={paramName}
            paramName={paramName}
            paramSchema={paramSchema}
            paramPath={"." + paramName}
            isQueryParam
          />
        );
      })}
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

  for (const paramSchema of param.objectSchema) {
    const paramName = paramSchema.name;
    if (requestBody[paramName] !== undefined) {
      addedAlready.push([paramName, paramSchema]);
    } else {
      remaining.push([paramName, paramSchema]);
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
        <ArrayParamDocs objectSchema={paramSchema.objectSchema} />
      )}
    </>
  );
}

// I think this window is extra special, we shouldn't reuse it for objects
function RecipeDocsParamContainer({
  paramSchema,
  paramName,
  paramPath,
  isQueryParam,
}: {
  paramSchema: RecipeParam;
  paramName: string;
  paramPath: string;
  isQueryParam?: boolean;
}) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const queryParams = useRecipeSessionStore((state) => state.queryParams);

  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );
  const updateQueryParams = useRecipeSessionStore(
    (state) => state.updateQueryParams
  );

  const paramState = getValueInObjPath(
    isQueryParam ? queryParams : requestBody,
    paramPath
  );

  const isParamInState = paramState !== undefined;

  const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [hideDocs, setHideDocs] = useState(true);

  const showNestedDocs = !isParamInState || !hideDocs;

  return (
    <div className="border rounded-sm p-4" id={`${paramPath}`}>
      <div className="flex justify-between items-center">
        <RecipeDocObjectDefinition
          paramName={paramName}
          paramSchema={paramSchema}
        />

        <div>
          <button
            ref={buttonRef}
            className={classNames("btn btn-sm", isParamInState && "btn-error")}
            onClick={() => {
              if (isParamInState) {
                updateParams({ path: paramPath, value: undefined });
              } else {
                updateParams({
                  path: paramPath,
                  value: getDefaultValue(paramSchema),
                });

                if (!isQueryParam) {
                  setTimeout(() => {
                    document
                      .getElementById(paramPath)
                      ?.lastElementChild?.scrollIntoView({
                        behavior: "instant" as ScrollBehavior,
                        block: "center",
                      });
                  }, 0); // Trick to wait for the DOM to update
                }
              }
            }}
          >
            {isParamInState ? "Remove" : "Add"}
          </button>
        </div>
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
          <>
            <button
              className={classNames(
                !isParamInState && "hidden",
                "text-sm underline"
              )}
              onClick={() => {
                setHideDocs(!hideDocs);
              }}
            >
              {hideDocs ? "Show docs" : "Hide docs"}
            </button>
            {showNestedDocs && (
              <ArrayParamDocs
                objectSchema={paramSchema.arraySchema.objectSchema}
              />
            )}
          </>
        )}

      {paramState !== undefined && (
        <div className="mt-4">
          <RecipeDocParamEdit
            paramSchema={paramSchema}
            paramPath={paramPath}
            isQueryParam={isQueryParam}
          />
        </div>
      )}
    </div>
  );
}

function ArrayParamDocs({
  objectSchema,
}: {
  objectSchema: RecipeObjectParam["objectSchema"];
}) {
  // const [showArraySchema, setShowArraySchema] = useState(false);

  const definition = (
    <div className="my-2">
      {objectSchema.map((innerParamSchema) => {
        const innerParamName = innerParamSchema.name;

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
}

interface RecipeDocParamEditProps {
  paramSchema: RecipeParam;
  paramPath: string;
  isQueryParam?: boolean;
}

function RecipeDocParamEdit({
  paramSchema,
  paramPath,
  isQueryParam,
}: RecipeDocParamEditProps) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const queryParams = useRecipeSessionStore((state) => state.queryParams);

  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );
  const updateQueryParams = useRecipeSessionStore(
    (state) => state.updateQueryParams
  );

  const paramState = getValueInObjPath(
    isQueryParam ? queryParams : requestBody,
    paramPath
  );
  const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;

  if (paramSchema.type === RecipeParamType.String) {
    if (paramSchema.enum) {
      return (
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={paramState as string}
          onChange={(e) => {
            updateParams({
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
      <>
        <textarea
          className="textarea textarea-bordered textarea-sm w-full"
          placeholder={
            paramSchema.default ? `example: ${paramSchema.default}` : undefined
          }
          rows={1}
          value={(paramState || "") as string}
          onChange={(e) => {
            // TODO: This feels expensive
            updateParams({
              path: paramPath,
              value: e.target.value,
            });
          }}
        />
      </>
    );
  } else if (paramSchema.type === RecipeParamType.Boolean) {
    return (
      <input
        type="checkbox"
        className="toggle"
        checked={(paramState || false) as boolean}
        onChange={(e) => {
          updateParams({
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
            value={(paramState || 0) as number}
            onChange={(e) => {
              updateParams({
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
        placeholder={
          paramSchema.default
            ? `example: ${String(paramSchema.default)}`
            : undefined
        }
        value={(paramState || 0) as number}
        onChange={(e) => {
          updateParams({
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
        isQueryParam={isQueryParam}
      />
    );
  } else if (paramSchema.type === RecipeParamType.Array) {
    return (
      <RecipeDocArrayParam
        paramPath={paramPath}
        paramSchema={paramSchema}
        isQueryParam={isQueryParam}
      />
    );
  } else if (paramSchema.type === RecipeParamType.Object) {
    return (
      <RecipeDocObjectParam
        paramPath={paramPath}
        paramSchema={paramSchema}
        isQueryParam={isQueryParam}
      />
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

function RecipeDocObjectParam({
  paramSchema,
  paramPath,
  isQueryParam,
}: {
  paramSchema: RecipeObjectParam;
  paramPath: string;
  isQueryParam?: boolean;
}) {
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const requestBody = useRecipeSessionStore((state) => state.requestBody);

  const paramState =
    getValueInObjPath<Record<string, unknown>>(
      isQueryParam ? queryParams : requestBody,
      paramPath
    ) || {};

  if (Object.keys(paramSchema.objectSchema).length === 0) {
    return <EditInEditor />;
  }

  return (
    <div className="border border-dashed rounded p-4 space-y-2 w-full">
      {Object.keys(paramState).map((innerParamName) => {
        const innerParamSchema = paramSchema.objectSchema.find(
          (param) => param.name === innerParamName
        )!;
        return (
          <div
            key={innerParamName}
            className="flex min-w-52 flex-col space-y-2"
          >
            <div>{innerParamName}</div>
            <RecipeDocParamEdit
              paramSchema={innerParamSchema}
              paramPath={`${paramPath}.${innerParamName}`}
              isQueryParam={isQueryParam}
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
  isQueryParam,
}: {
  paramSchema: RecipeArrayParam;
  paramPath: string;
  isQueryParam?: boolean;
}) {
  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );
  const updateQueryParams = useRecipeSessionStore(
    (state) => state.updateQueryParams
  );

  const paramState =
    getValueInObjPath<unknown[]>(
      isQueryParam ? queryParams : requestBody,
      paramPath
    ) || [];

  const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;

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

                  updateParams({
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

            updateParams({
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
  isQueryParam,
}: {
  paramSchema: RecipeVariedParam;
  paramPath: string;
  isQueryParam?: boolean;
}) {
  const updateRequestBody = useRecipeSessionStore(
    (state) => state.updateRequestBody
  );
  const updateQueryParams = useRecipeSessionStore(
    (state) => state.updateQueryParams
  );
  const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;

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
            updateParams({
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

// These docs are more simplified and don't need as much as queryParams or requestBody so opting to do it all here
function RecipeUrlDocsContainer({
  urlParamsSchema,
}: {
  urlParamsSchema: RecipeObjectSchemas;
}) {
  const urlParams = useRecipeSessionStore((state) => state.urlParams);
  const updateUrlParams = useRecipeSessionStore(
    (state) => state.updateUrlParams
  );

  return (
    <div className="my-4">
      {urlParamsSchema.map((paramSchema) => {
        const paramName = paramSchema.name;
        const value = urlParams[paramName] as string | undefined;

        return (
          <div className="border rounded-sm p-4" key={paramName}>
            <div className="flex justify-between items-center">
              <RecipeDocObjectDefinition
                paramName={paramName}
                paramSchema={paramSchema}
              />
            </div>
            {paramSchema.description && (
              <ReactMarkdown
                className="text-sm mt-2"
                components={{
                  a: (props) => (
                    <a {...props} className="text-blue-600 underline" />
                  ),
                }}
              >
                {paramSchema.description}
              </ReactMarkdown>
            )}

            <div className="mt-4">
              {!("enum" in paramSchema) ? (
                <input
                  className="input input-bordered input-sm w-full"
                  placeholder={
                    paramSchema.default
                      ? `example: ${paramSchema.default}`
                      : undefined
                  }
                  value={(value || "") as string}
                  onChange={(e) => {
                    updateUrlParams({
                      param: paramName,
                      value: e.target.value,
                    });
                  }}
                />
              ) : (
                <select
                  className="select select-bordered select-sm w-full max-w-xs"
                  value={value || ""}
                  onChange={(e) => {
                    updateUrlParams({
                      param: paramName,
                      value: e.target.value,
                    });
                  }}
                >
                  {paramSchema.enum?.map((value) => {
                    return <option key={value}>{value}</option>;
                  })}
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
