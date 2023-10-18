import classNames from "classnames";
import {
  RecipeArrayParam,
  RecipeObjectParam,
  RecipeObjectSchemas,
  RecipeParam,
  RecipeVariedParam,
  isVariedParam,
} from "types/database";
import { RecipeParamType } from "types/enums";

import ReactMarkdown from "react-markdown";
import {
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
import { getDefaultValuev1, getValueInObjPath } from "../../utils/main";
import { EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { JSONSchema6 } from "json-schema";
import { MARKDOWN_NEWLINES_REGEX } from "utils/constants";

export function RecipeDocs() {
  const selectedRecipe = useContext(RecipeContext);
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  if (!selectedRecipe) {
    return null;
  }
  const requestBody =
    "requestBody" in selectedRecipe ? selectedRecipe.requestBody : null;
  const queryParams =
    "queryParams" in selectedRecipe ? selectedRecipe.queryParams : null;

  const urlParams =
    "urlParams" in selectedRecipe ? selectedRecipe.urlParams : null;

  // const hasMultipleParams =
  //   [requestBody, queryParams, urlParams].filter((param) => param !== null)
  //     .length > 1;

  const hasMultipleParams = false;

  return (
    <div
      className={classNames(
        "sm:absolute inset-0 px-4 py-6 overflow-y-auto right-pane-bg",
        loadingTemplate && "cursor-wait pointer-events-none"
      )}
    >
      {loadingTemplate ? (
        <>
          <h1 className="text-md sm:text-lg font-bold flex items-center">
            Simulating parameters for this example
            <span className="loading loading-bars ml-2"></span>
          </h1>
        </>
      ) : (
        <>
          <h1 className="text-lg sm:text-xl font-bold">
            {selectedRecipe.title}
          </h1>
          {selectedRecipe.summary && (
            <ReactMarkdown className="mt-2 recipe-md space-y-4">
              {selectedRecipe.summary.replaceAll(
                MARKDOWN_NEWLINES_REGEX,
                "\n\n"
              )}
            </ReactMarkdown>
          )}
        </>
      )}
      {urlParams && (
        <RecipeUrlDocsContainer
          urlParamsSchema={urlParams as unknown as JSONSchema6}
          showHeader={hasMultipleParams}
        />
      )}
      {requestBody && (
        <RecipeDocsContainer
          param={requestBody as JSONSchema6}
          showHeader={hasMultipleParams}
        />
      )}
      {queryParams && (
        <RecipeQueryDocsContainer
          queryParams={queryParams as unknown as JSONSchema6}
          showHeader={hasMultipleParams}
        />
      )}
    </div>
  );
}
type ExtendedJSONSchema6 = JSONSchema6 & {
  name: string;
  isRequired: boolean;
};

function RecipeQueryDocsContainer({
  queryParams,
  showHeader,
}: {
  queryParams: JSONSchema6;
  showHeader: boolean;
}) {
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const queryParamsPayload = useRecipeSessionStore(
    (state) => state.queryParams
  );

  const addedAlready: ExtendedJSONSchema6[] = [];
  const remaining: ExtendedJSONSchema6[] = [];

  const properties = Object.keys(queryParams.properties || {});
  for (const paramName of properties) {
    const _paramSchema = queryParams.properties![paramName] as JSONSchema6;
    const paramSchema = {
      ..._paramSchema,
      name: paramName,
      isRequired: queryParams.required?.includes(paramName) || false,
    };

    if (queryParamsPayload[paramName] !== undefined) {
      addedAlready.push(paramSchema);
    } else {
      remaining.push(paramSchema);
    }
  }

  return (
    <div className="my-4 ">
      {showHeader && <h3 className="mb-2 text-sm">Query Params</h3>}
      <div
        className={classNames(
          loadingTemplate &&
            "animate-pulse dark:text-white flex flex-col-reverse"
        )}
      >
        {addedAlready.map((paramSchema) => {
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
      {!loadingTemplate && (
        <div>
          {remaining.map((paramSchema) => {
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
      )}
    </div>
  );
}

function RecipeDocsContainer({
  param,
  showHeader,
}: {
  param: JSONSchema6;
  showHeader: boolean;
}) {
  const _requestBody = useRecipeSessionStore((state) => state.requestBody);

  const requestBody = _requestBody;
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const addedAlready: ExtendedJSONSchema6[] = [];
  const remaining: ExtendedJSONSchema6[] = [];

  const properties = Object.keys(param.properties || {});
  for (const paramName of properties) {
    const innerSchema = param.properties![paramName] as JSONSchema6;

    const extendedSchema = {
      ...innerSchema,
      name: paramName,
      isRequired: param.required?.includes(paramName) || false,
    };

    if (requestBody[paramName] !== undefined) {
      addedAlready.push(extendedSchema);
    } else {
      remaining.push(extendedSchema);
    }
  }

  return (
    <div className="my-4">
      {showHeader && <h3 className="mb-2 text-sm">Request Params</h3>}
      {addedAlready.length > 0 && (
        <div
          className={classNames(
            remaining.length > 0 ? "mb-4" : "",
            loadingTemplate &&
              "animate-pulse  dark:text-white flex flex-col-reverse"
          )}
          id="recipe-added"
        >
          {addedAlready.map((paramSchema) => {
            return (
              <RecipeDocsParamContainer
                key={paramSchema.name}
                paramName={paramSchema.name}
                paramSchema={paramSchema}
                paramPath={"." + paramSchema.name}
                isQueryParam={false}
              />
            );
          })}
        </div>
      )}
      {!loadingTemplate && remaining.length > 0 && (
        <div>
          {remaining.map((paramSchema) => {
            return (
              <RecipeDocsParamContainer
                key={paramSchema.name}
                paramName={paramSchema.name}
                paramSchema={paramSchema}
                paramPath={"." + paramSchema.name}
                isQueryParam={false}
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
  paramSchema: ExtendedJSONSchema6;
  showRequired?: boolean;
}) {
  const required = Boolean(paramSchema.isRequired);

  return (
    <>
      <div className="space-x-4">
        <span className="font-bold">{paramName}</span>
        <span className="text-sm">{paramSchema.type}</span>
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
      {/* TODO: Array param */}
      {/* {paramSchema.type === RecipeParamType.Object && (
        <ArrayParamDocs objectSchema={paramSchema.objectSchema} />
      )} */}
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
  paramSchema: ExtendedJSONSchema6;
  paramName: string;
  paramPath: string;
  isQueryParam: boolean;
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
    <div
      className="border border-slate-200 dark:border-slate-600 rounded-sm p-4"
      id={`${paramPath}`}
    >
      <div className="flex justify-between items-center">
        <RecipeDocObjectDefinition
          paramName={paramName}
          paramSchema={paramSchema}
        />

        <div>
          <button
            ref={buttonRef}
            className={classNames(
              "btn btn-sm",
              isParamInState ? "btn-error" : "bg-neutral-300 dark:bg-base-200"
            )}
            onClick={() => {
              if (isParamInState) {
                updateParams({ path: paramPath, value: undefined });
              } else {
                updateParams({
                  path: paramPath,
                  value: getDefaultValuev1(paramSchema, {
                    isRequired: paramSchema.isRequired,
                  }),
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
            {isParamInState ? "Remove" : "Add"}
          </button>
        </div>
      </div>
      {paramSchema.description && (
        <ReactMarkdown
          className="text-sm mt-2 recipe-md"
          components={{
            a: (props) => <a {...props} className="text-blue-600 underline" />,
          }}
        >
          {paramSchema.description.replaceAll(MARKDOWN_NEWLINES_REGEX, "\n\n")}
        </ReactMarkdown>
      )}
      {/* {paramSchema.type === RecipeParamType.Array &&
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
        )} */}

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

// function ArrayParamDocs({
//   objectSchema,
// }: {
//   objectSchema: RecipeObjectParam["objectSchema"];
// }) {
//   // const [showArraySchema, setShowArraySchema] = useState(false);

//   const definition = (
//     <div className="my-2">
//       {objectSchema.map((innerParamSchema) => {
//         const innerParamName = innerParamSchema.name;

//         return (
//           <div
//             className="border border-slate-200 dark:border-slate-600 rounded-sm p-4"
//             key={innerParamName}
//           >
//             <RecipeDocObjectDefinition
//               key={innerParamName}
//               paramName={innerParamName}
//               paramSchema={innerParamSchema}
//             />
//             {innerParamSchema.description && (
//               <ReactMarkdown
//                 className="text-sm mt-2"
//                 components={{
//                   a: (props) => (
//                     <a {...props} className="text-blue-600 underline" />
//                   ),
//                 }}
//               >
//                 {innerParamSchema.description}
//               </ReactMarkdown>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
//   return definition;
// }

interface RecipeDocParamEditProps {
  paramSchema: ExtendedJSONSchema6;
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
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  if (!paramSchema) {
    return null;
  }

  if (paramSchema.type === RecipeParamType.String) {
    if (paramSchema.enum && typeof paramSchema.enum[0] === "string") {
      return (
        <select
          id={`${paramPath}`}
          className="select select-bordered select-sm w-full max-w-xs text-black dark:text-white"
          value={paramState as string}
          onChange={(e) => {
            updateParams({
              path: paramPath,
              value: e.target.value,
            });
          }}
        >
          {paramSchema.enum?.map((value) => {
            return <option key={value as string}>{value as string}</option>;
          })}
        </select>
      );
    }

    return (
      <>
        <textarea
          id={`${paramPath}`}
          className="textarea textarea-bordered textarea-sm w-full text-black dark:text-white"
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
        id={`${paramPath}`}
        type="checkbox"
        className="toggle toggle-accent text-black dark:text-white"
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
        <div className="space-x-4 flex items-center text-black dark:text-white">
          <input
            id={`${paramPath}`}
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
            className="range range-xs w-32 range-accent"
          />
          <span>{paramState as number}</span>
        </div>
      );
    }

    return (
      <input
        id={`${paramPath}`}
        type="number"
        className="input input-sm input-bordered text-black dark:text-white"
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
  }

  // else if (isVariedParam(paramSchema.type) && "variants" in paramSchema) {
  //   return (
  //     <RecipeDocVariedParamEdit
  //       paramSchema={paramSchema}
  //       paramPath={paramPath}
  //       isQueryParam={isQueryParam}
  //     />
  //   );
  // }
  //   );
  // }

  // else if (paramSchema.type === RecipeParamType.File) {
  //   return <RecipeFileParamEdit paramPath={paramPath} />;
  // }

  // if (loadingTemplate) {
  return (
    <textarea
      className="textarea textarea-bordered textarea-sm w-full text-black dark:text-white"
      rows={3}
      defaultValue={JSON.stringify(paramState)}
    />
  );
  // }

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
        <div className="">
          <div className="mr-2 text-sm border border-slate-200 dark:border-slate-600 border-dashed rounded-md p-2">
            {fileInfo.name}
          </div>
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
      Fork this to fully customize the request.
    </div>
  );
}

function RecipeDocObjectParam({
  paramSchema,
  paramPath,
  isQueryParam,
}: {
  paramSchema: JSONSchema6;
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

  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  if (
    !paramSchema.properties ||
    Object.keys(paramSchema.properties).length === 0
  ) {
    // if (loadingTemplate) {
    return (
      <textarea
        className="textarea textarea-bordered textarea-sm w-full text-black dark:text-white"
        defaultValue={JSON.stringify(paramState)}
        rows={3}
        disabled
      />
    );
    // }

    // return <EditInEditor />;
  }

  return (
    <div className="border border-slate-200 dark:border-slate-600 border-dashed rounded p-4 space-y-2 w-full">
      {Object.keys(paramState).map((innerParamName) => {
        const innerParamSchema = paramSchema.properties![
          innerParamName
        ] as JSONSchema6;
        return (
          <div
            key={innerParamName}
            className="flex min-w-52 flex-col space-y-2"
          >
            <div>{innerParamName}</div>
            <RecipeDocParamEdit
              paramSchema={{
                ...innerParamSchema,
                name: innerParamName,
                isRequired:
                  paramSchema.required?.includes(innerParamName) || false,
              }}
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
  paramSchema: ExtendedJSONSchema6;
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

  let objectParams: ExtendedJSONSchema6[] = paramSchema.properties
    ? Object.keys(paramSchema.properties).map((property) => {
        const innerSchema: ExtendedJSONSchema6 = {
          ...(paramSchema.properties![property] as ExtendedJSONSchema6),
          name: property,
          isRequired: paramSchema.required?.includes(property) || false,
        };

        return innerSchema;
      })
    : [];

  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const extendedParamSchema: ExtendedJSONSchema6 = {
    ...(paramSchema.items as JSONSchema6),
    name: paramSchema.name,
    isRequired: paramSchema.isRequired,
  };

  return (
    <div className="">
      <div
        className={classNames(
          paramState.length > 0 &&
            "mb-2 space-y-2 border border-slate-200 dark:border-slate-600 rounded-sm p-2",
          loadingTemplate && "flex flex-col-reverse"
        )}
      >
        {paramState?.map((paramInfo, index) => {
          const currentParams = Object.keys(
            paramInfo as Record<string, unknown>
          );

          const missingParams = objectParams.filter((param) => {
            if (!("name" in param)) return false;

            return !currentParams.includes(param.name);
          });

          const innerParamPath = `${paramPath}.[${index}]`;

          return (
            <div key={index}>
              <div className="flex items-center space-x-2 w-full">
                <RecipeDocParamEdit
                  paramSchema={extendedParamSchema}
                  paramPath={innerParamPath}
                  isQueryParam={isQueryParam}
                />
                <div className="flex flex-col">
                  <button
                    className="btn btn-xs"
                    onClick={() => {
                      const newParamState = [...paramState];
                      newParamState.splice(index, 1);

                      updateParams({
                        path: paramPath,
                        value:
                          newParamState.length > 0 ? newParamState : undefined,
                      });
                    }}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                  {missingParams.length > 0 && (
                    <>
                      {missingParams.map((param) => {
                        if (!("name" in param)) return null;

                        return (
                          <button
                            key={param.name as string}
                            className="btn btn-xs tooltip tooltip-left"
                            data-tip={`"${param.name}" was optional. Want to add it?`}
                            onClick={() => {
                              updateParams({
                                path: `${paramPath}.[${index}].${param.name}`,
                                value: getDefaultValuev1(extendedParamSchema, {
                                  isRequired: true,
                                  checkRequired: true,
                                }),
                              });
                            }}
                          >
                            <EyeSlashIcon className="w-h h-3" />
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
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
            const defaultParam = getDefaultValuev1(extendedParamSchema, {
              checkRequired: true,
              isRequired: true,
            });

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

// function RecipeDocVariedParamEdit({
//   paramSchema,
//   paramPath,
//   isQueryParam,
// }: {
//   paramSchema: RecipeVariedParam;
//   paramPath: string;
//   isQueryParam?: boolean;
// }) {
//   const updateRequestBody = useRecipeSessionStore(
//     (state) => state.updateRequestBody
//   );
//   const updateQueryParams = useRecipeSessionStore(
//     (state) => state.updateQueryParams
//   );
//   const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;

//   const [primaryVariantIndex, setPrimaryVariantIndex] = useState(0);

//   const { isEnumButSingleType, paramTypes, enumVariantIndex } =
//     getVariedParamInfo(paramSchema);

//   // This edge case is very overkill UX optimization. Essentially this covers the case where the user can select
//   // a list of options ["a", "b", "c", "d"] or put in their own option.
//   // In most cases, the user should should choose from the list rather than do their own
//   if (isEnumButSingleType) {
//     const enumVariant = paramSchema.variants[enumVariantIndex];
//     return (
//       <RecipeDocParamEdit
//         // @ts-expect-error the type here is wrong
//         paramSchema={{
//           ...paramSchema,
//           type: paramTypes[0] as unknown as RecipeParamType,
//           enum: "enum" in enumVariant ? enumVariant.enum : undefined,
//         }}
//         isQueryParam={isQueryParam}
//         paramPath={paramPath}
//       />
//     );
//   }

//   // We need to cycle between different variants. How do we do that? we can show dropdown

//   const primaryVariant = paramSchema.variants[primaryVariantIndex];

//   return (
//     <div className="">
//       <RecipeDocParamEdit
//         paramPath={paramPath}
//         paramSchema={primaryVariant}
//         isQueryParam={isQueryParam}
//       />
//       <div
//         className={classNames(
//           "tooltip tooltip-right",
//           primaryVariant.type === RecipeParamType.Array ? "mt-2" : "mt-2"
//         )}
//         data-tip="This parameter can take different types."
//       >
//         <button
//           className="btn btn-sm"
//           onClick={() => {
//             const newVariantIndex =
//               (primaryVariantIndex + 1) % paramSchema.variants.length;

//             setPrimaryVariantIndex(newVariantIndex);

//             // We're gonna have to reset the default value here
//             const nextVariant = paramSchema.variants[newVariantIndex];
//             updateParams({
//               path: paramPath,
//               value: getDefaultValue(nextVariant),
//             });
//           }}
//         >
//           Change Variant
//         </button>
//       </div>
//     </div>
//   );

//   // paramSchema
//   // We need to do something special here for model
// }

// These docs are more simplified and don't need as much as queryParams or requestBody so opting to do it all here
function RecipeUrlDocsContainer({
  urlParamsSchema,
  showHeader,
}: {
  urlParamsSchema: JSONSchema6;
  showHeader: boolean;
}) {
  const urlParams = useRecipeSessionStore((state) => state.urlParams);
  const updateUrlParams = useRecipeSessionStore(
    (state) => state.updateUrlParams
  );

  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  if (!urlParamsSchema.properties) {
    return null;
  }

  return (
    <div className={classNames("my-4")}>
      {showHeader && <h3 className="mb-2 text-sm">Url Params</h3>}
      {Object.keys(urlParamsSchema.properties).map((paramName) => {
        const _paramSchema = urlParamsSchema.properties![
          paramName
        ] as JSONSchema6;

        const paramSchema: ExtendedJSONSchema6 = {
          ..._paramSchema,
          isRequired: urlParamsSchema.required?.includes(paramName) || false,
          name: paramName,
        };

        const value = urlParams[paramName] as string | undefined;

        if (loadingTemplate && value === undefined) {
          return null;
        }

        return (
          <div
            className={classNames(
              "border border-slate-200 dark:border-slate-600 rounded-sm p-4",
              loadingTemplate && "animate-pulse dark:text-white"
            )}
            key={paramName}
          >
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
                      path: paramName,
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
                      path: paramName,
                      value: e.target.value,
                    });
                  }}
                >
                  <option className="none"></option>

                  {paramSchema.enum?.map((value) => {
                    return (
                      <option
                        key={value as string}
                        value={(value as string) || ""}
                      >
                        {value === "" ? "(none)" : (value as string)}
                      </option>
                    );
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
