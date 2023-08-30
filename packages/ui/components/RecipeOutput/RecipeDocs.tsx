// import classNames from "classnames";
// import {
//   RecipeArrayParam,
//   RecipeObjectParam,
//   RecipeObjectSchemas,
//   RecipeParam,
//   RecipeVariedParam,
//   isVariedParam,
// } from "types/database";
// import { RecipeParamType } from "types/enums";

// import ReactMarkdown from "react-markdown";
// import {
//   RecipeContext,
//   useRecipeSessionStore,
// } from "../../state/recipeSession";
// import { ChangeEvent, useContext, useEffect, useRef, useState } from "react";
// import { getDefaultValue, getValueInObjPath } from "../../utils/main";
// import { EyeSlashIcon, XMarkIcon } from "@heroicons/react/24/outline";
// import { RecipeDocsv1 } from "./RecipeDocsv1";

// export function DEPRECATED_RecipeDocs() {
//   const selectedRecipe = useContext(RecipeContext)!;

//   const requestBody =
//     "requestBody" in selectedRecipe ? selectedRecipe.requestBody : null;
//   const queryParams =
//     "queryParams" in selectedRecipe ? selectedRecipe.queryParams : null;

//   const urlParams =
//     "urlParams" in selectedRecipe ? selectedRecipe.urlParams : null;

//   const hasMultipleParams =
//     [requestBody, queryParams, urlParams].filter((param) => param !== null)
//       .length > 1;

//   const loadingTemplate = useRecipeSessionStore(
//     (state) => state.loadingTemplate
//   );

//   if (selectedRecipe.version === 1) {
//     return <RecipeDocsv1 />;
//   }

//   return (
//     <div
//       className={classNames(
//         "sm:absolute inset-0 px-4 py-6 overflow-y-auto bg-gray-800 dark:bg-gray-700 text-gray-300",
//         loadingTemplate && "cursor-wait pointer-events-none"
//       )}
//     >
//       {loadingTemplate ? (
//         <>
//           <h1 className="text-md sm:text-lg font-bold flex items-center">
//             Mocking parameters for this example
//             <span className="loading loading-bars ml-2"></span>
//           </h1>
//         </>
//       ) : (
//         <>
//           <h1 className="text-lg sm:text-xl font-bold">
//             {selectedRecipe.title}
//           </h1>
//           {selectedRecipe.summary && (
//             <ReactMarkdown className="mt-2 recipe-md">
//               {selectedRecipe.summary}
//             </ReactMarkdown>
//           )}
//         </>
//       )}

//       {urlParams && (
//         <RecipeUrlDocsContainer
//           urlParamsSchema={urlParams}
//           showHeader={hasMultipleParams}
//         />
//       )}
//       {requestBody && "objectSchema" in requestBody && (
//         <RecipeDocsContainer
//           param={requestBody}
//           paramPath=""
//           showHeader={hasMultipleParams}
//         />
//       )}
//       {queryParams && (
//         <RecipeQueryDocsContainer
//           queryParams={queryParams}
//           showHeader={hasMultipleParams}
//         />
//       )}
//     </div>
//   );
// }

// function RecipeQueryDocsContainer({
//   queryParams,
//   showHeader,
// }: {
//   queryParams: RecipeObjectSchemas;
//   showHeader: boolean;
// }) {
//   const loadingTemplate = useRecipeSessionStore(
//     (state) => state.loadingTemplate
//   );
//   const queryParamsPayload = useRecipeSessionStore(
//     (state) => state.queryParams
//   );

//   const addedAlready: RecipeObjectSchemas[number][] = [];
//   const remaining: RecipeObjectSchemas[number][] = [];

//   for (const paramSchema of queryParams) {
//     const paramName = paramSchema.name;
//     if (queryParamsPayload[paramName] !== undefined) {
//       addedAlready.push(paramSchema);
//     } else {
//       remaining.push(paramSchema);
//     }
//   }

//   return (
//     <div className="my-4 ">
//       {showHeader && <h3 className="mb-2 text-sm">Query Params</h3>}
//       <div
//         className={classNames(
//           loadingTemplate &&
//             "animate-pulse dark:text-white flex flex-col-reverse"
//         )}
//       >
//         {addedAlready.map((paramSchema) => {
//           const paramName = paramSchema.name;
//           return (
//             <RecipeDocsParamContainer
//               key={paramName}
//               paramName={paramName}
//               paramSchema={paramSchema}
//               paramPath={"." + paramName}
//               isQueryParam
//             />
//           );
//         })}
//       </div>
//       {!loadingTemplate && (
//         <div>
//           {remaining.map((paramSchema) => {
//             const paramName = paramSchema.name;
//             return (
//               <RecipeDocsParamContainer
//                 key={paramName}
//                 paramName={paramName}
//                 paramSchema={paramSchema}
//                 paramPath={"." + paramName}
//                 isQueryParam
//               />
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// function RecipeDocsContainer({
//   param,
//   paramPath,
//   showHeader,
// }: {
//   param: RecipeObjectParam;
//   paramPath: string;
//   showHeader: boolean;
// }) {
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);
//   const loadingTemplate = useRecipeSessionStore(
//     (state) => state.loadingTemplate
//   );
//   const addedAlready: [string, RecipeParam][] = [];
//   const remaining: [string, RecipeParam][] = [];

//   for (const paramSchema of param.objectSchema) {
//     const paramName = paramSchema.name;
//     if (requestBody[paramName] !== undefined) {
//       addedAlready.push([paramName, paramSchema]);
//     } else {
//       remaining.push([paramName, paramSchema]);
//     }
//   }

//   return (
//     <div className="my-4">
//       {showHeader && <h3 className="mb-2 text-sm">Request Params</h3>}
//       {addedAlready.length > 0 && (
//         <div
//           className={classNames(
//             remaining.length > 0 ? "mb-4" : "",
//             loadingTemplate &&
//               "animate-pulse  dark:text-white flex flex-col-reverse"
//           )}
//           id="recipe-added"
//         >
//           {addedAlready.map(([propertyName, paramSchema]) => {
//             return (
//               <RecipeDocsParamContainer
//                 key={propertyName}
//                 paramName={propertyName}
//                 paramSchema={paramSchema}
//                 paramPath={paramPath + "." + propertyName}
//                 isQueryParam={false}
//               />
//             );
//           })}
//         </div>
//       )}
//       {!loadingTemplate && remaining.length > 0 && (
//         <div>
//           {remaining.map(([propertyName, paramSchema]) => {
//             return (
//               <RecipeDocsParamContainer
//                 key={propertyName}
//                 paramName={propertyName}
//                 paramSchema={paramSchema}
//                 paramPath={paramPath + "." + propertyName}
//                 isQueryParam={false}
//               />
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

// function getParamTypes(schema: RecipeVariedParam) {
//   // Need to make this a set to remove duplicates
//   const types = new Set(schema.variants.map((variant) => variant.type));
//   return Array.from(types);
// }

// function RecipeDocObjectDefinition({
//   paramName,
//   paramSchema,
//   showRequired = true,
// }: {
//   paramName: string;
//   paramSchema: RecipeParam;
//   showRequired?: boolean;
// }) {
//   const required = Boolean(paramSchema.required);

//   return (
//     <>
//       <div className="space-x-4">
//         <span className="font-bold">{paramName}</span>
//         <span className="text-sm">
//           {"variants" in paramSchema
//             ? getParamTypes(paramSchema).join(" or ")
//             : paramSchema.type}
//         </span>
//         {showRequired && (
//           <span
//             className={classNames(
//               "text-sm",
//               required ? "text-red-600" : "text-gray-600"
//             )}
//           >
//             {required ? "required" : "optional"}
//           </span>
//         )}
//       </div>
//       {paramSchema.type === RecipeParamType.Object && (
//         <ArrayParamDocs objectSchema={paramSchema.objectSchema} />
//       )}
//     </>
//   );
// }

// // I think this window is extra special, we shouldn't reuse it for objects
// function RecipeDocsParamContainer({
//   paramSchema,
//   paramName,
//   paramPath,
//   isQueryParam,
// }: {
//   paramSchema: RecipeParam;
//   paramName: string;
//   paramPath: string;
//   isQueryParam: boolean;
// }) {
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);
//   const queryParams = useRecipeSessionStore((state) => state.queryParams);

//   const updateRequestBody = useRecipeSessionStore(
//     (state) => state.updateRequestBody
//   );
//   const updateQueryParams = useRecipeSessionStore(
//     (state) => state.updateQueryParams
//   );

//   const paramState = getValueInObjPath(
//     isQueryParam ? queryParams : requestBody,
//     paramPath
//   );

//   const isParamInState = paramState !== undefined;

//   const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;
//   const buttonRef = useRef<HTMLButtonElement>(null);

//   const [hideDocs, setHideDocs] = useState(true);

//   const showNestedDocs = !isParamInState || !hideDocs;

//   return (
//     <div
//       className="border border-slate-200 dark:border-slate-600 rounded-sm p-4"
//       id={`${paramPath}`}
//     >
//       <div className="flex justify-between items-center">
//         <RecipeDocObjectDefinition
//           paramName={paramName}
//           paramSchema={paramSchema}
//         />

//         <div>
//           <button
//             ref={buttonRef}
//             className={classNames(
//               "btn btn-sm",
//               isParamInState ? "btn-error" : "bg-neutral-300 dark:bg-base-200"
//             )}
//             onClick={() => {
//               if (isParamInState) {
//                 updateParams({ path: paramPath, value: undefined });
//               } else {
//                 updateParams({
//                   path: paramPath,
//                   value: getDefaultValue(paramSchema),
//                 });

//                 setTimeout(() => {
//                   document
//                     .getElementById(paramPath)
//                     ?.lastElementChild?.scrollIntoView({
//                       behavior: "instant" as ScrollBehavior,
//                       block: "center",
//                     });
//                 }, 0); // Trick to wait for the DOM to update
//               }
//             }}
//           >
//             {isParamInState ? "Remove" : "Add"}
//           </button>
//         </div>
//       </div>
//       {paramSchema.description && (
//         <ReactMarkdown
//           className="text-sm mt-2"
//           components={{
//             a: (props) => <a {...props} className="text-blue-600 underline" />,
//           }}
//         >
//           {paramSchema.description}
//         </ReactMarkdown>
//       )}
//       {paramSchema.type === RecipeParamType.Array &&
//         paramSchema.arraySchema.type === RecipeParamType.Object && (
//           <>
//             <button
//               className={classNames(
//                 !isParamInState && "hidden",
//                 "text-sm underline"
//               )}
//               onClick={() => {
//                 setHideDocs(!hideDocs);
//               }}
//             >
//               {hideDocs ? "Show docs" : "Hide docs"}
//             </button>
//             {showNestedDocs && (
//               <ArrayParamDocs
//                 objectSchema={paramSchema.arraySchema.objectSchema}
//               />
//             )}
//           </>
//         )}

//       {paramState !== undefined && (
//         <div className="mt-4">
//           <RecipeDocParamEdit
//             paramSchema={paramSchema}
//             paramPath={paramPath}
//             isQueryParam={isQueryParam}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

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

// interface RecipeDocParamEditProps {
//   paramSchema: RecipeParam;
//   paramPath: string;
//   isQueryParam?: boolean;
// }

// function RecipeDocParamEdit({
//   paramSchema,
//   paramPath,
//   isQueryParam,
// }: RecipeDocParamEditProps) {
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);
//   const queryParams = useRecipeSessionStore((state) => state.queryParams);

//   const updateRequestBody = useRecipeSessionStore(
//     (state) => state.updateRequestBody
//   );
//   const updateQueryParams = useRecipeSessionStore(
//     (state) => state.updateQueryParams
//   );

//   const paramState = getValueInObjPath(
//     isQueryParam ? queryParams : requestBody,
//     paramPath
//   );
//   const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;

//   if (paramSchema.type === RecipeParamType.String) {
//     if (paramSchema.enum) {
//       return (
//         <select
//           id={`${paramPath}`}
//           className="select select-bordered select-sm w-full max-w-xs"
//           value={paramState as string}
//           onChange={(e) => {
//             updateParams({
//               path: paramPath,
//               value: e.target.value,
//             });
//           }}
//         >
//           {paramSchema.enum?.map((value) => {
//             return <option key={value}>{value}</option>;
//           })}
//         </select>
//       );
//     }

//     return (
//       <>
//         <textarea
//           id={`${paramPath}`}
//           className="textarea textarea-bordered textarea-sm w-full"
//           placeholder={
//             paramSchema.default ? `example: ${paramSchema.default}` : undefined
//           }
//           rows={1}
//           value={(paramState || "") as string}
//           onChange={(e) => {
//             // TODO: This feels expensive
//             updateParams({
//               path: paramPath,
//               value: e.target.value,
//             });
//           }}
//         />
//       </>
//     );
//   } else if (paramSchema.type === RecipeParamType.Boolean) {
//     return (
//       <input
//         id={`${paramPath}`}
//         type="checkbox"
//         className="toggle toggle-accent"
//         checked={(paramState || false) as boolean}
//         onChange={(e) => {
//           updateParams({
//             path: paramPath,
//             value: e.target.checked,
//           });
//         }}
//       />
//     );
//   } else if (
//     paramSchema.type === RecipeParamType.Number ||
//     paramSchema.type === RecipeParamType.Integer
//   ) {
//     // Do something special if minimum and maxmium are defined
//     if (paramSchema.maximum != undefined && paramSchema.minimum != undefined) {
//       return (
//         <div className="space-x-4 flex items-center">
//           <input
//             id={`${paramPath}`}
//             type="range"
//             min={paramSchema.minimum}
//             max={paramSchema.maximum}
//             value={(paramState || 0) as number}
//             onChange={(e) => {
//               updateParams({
//                 path: paramPath,
//                 value: Number(e.target.value),
//               });
//             }}
//             step={paramSchema.type === RecipeParamType.Integer ? 1 : "0.01"}
//             className="range range-xs w-32 range-accent"
//           />
//           <span>{paramState as number}</span>
//         </div>
//       );
//     }

//     return (
//       <input
//         id={`${paramPath}`}
//         type="number"
//         className="input input-sm input-bordered"
//         placeholder={
//           paramSchema.default
//             ? `example: ${String(paramSchema.default)}`
//             : undefined
//         }
//         value={(paramState || 0) as number}
//         onChange={(e) => {
//           updateParams({
//             path: paramPath,
//             value: Number(e.target.value),
//           });
//         }}
//       />
//     );
//   } else if (isVariedParam(paramSchema.type) && "variants" in paramSchema) {
//     return (
//       <RecipeDocVariedParamEdit
//         paramSchema={paramSchema}
//         paramPath={paramPath}
//         isQueryParam={isQueryParam}
//       />
//     );
//   } else if (paramSchema.type === RecipeParamType.Array) {
//     return (
//       <RecipeDocArrayParam
//         paramPath={paramPath}
//         paramSchema={paramSchema}
//         isQueryParam={isQueryParam}
//       />
//     );
//   } else if (paramSchema.type === RecipeParamType.Object) {
//     return (
//       <RecipeDocObjectParam
//         paramPath={paramPath}
//         paramSchema={paramSchema}
//         isQueryParam={isQueryParam}
//       />
//     );
//   } else if (paramSchema.type === RecipeParamType.File) {
//     return <RecipeFileParamEdit paramPath={paramPath} />;
//   }

//   return <EditInEditor />;
// }

// function RecipeFileParamEdit({ paramPath }: { paramPath: string }) {
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);
//   const fileManagerInfo = useRecipeSessionStore((state) => state.fileManager);
//   const currentSession = useRecipeSessionStore(
//     (state) => state.currentSession!
//   );
//   const updateFileInfo = useRecipeSessionStore(
//     (state) => state.updateFileManager
//   );
//   const deleteFileInfo = useRecipeSessionStore(
//     (state) => state.deleteFileManager
//   );

//   const updateRequestBody = useRecipeSessionStore(
//     (state) => state.updateRequestBody
//   );

//   const fileInfo = fileManagerInfo[currentSession.id] as File | undefined;
//   const paramState = getValueInObjPath(requestBody, paramPath) as
//     | string
//     | undefined;

//   useEffect(() => {
//     if (fileInfo === undefined && paramState !== undefined) {
//       updateRequestBody({
//         path: paramPath,
//         value: null,
//       });
//     }
//   }, []);

//   const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];

//     if (file) {
//       updateRequestBody({
//         path: paramPath,
//         value: file?.name,
//       });
//       updateFileInfo(currentSession.id, file);
//     }
//   };

//   return (
//     <div className="flex space-x-2 items-center">
//       {fileInfo && paramState ? (
//         <div className="">
//           <div className="mr-2 text-sm border border-slate-200 dark:border-slate-600 border-dashed rounded-md p-2">
//             {fileInfo.name}
//           </div>
//           <button
//             className="btn btn-sm"
//             onClick={() => {
//               updateRequestBody({
//                 path: paramPath,
//                 value: null,
//               });
//               deleteFileInfo(currentSession.id);
//             }}
//           >
//             Change
//           </button>
//         </div>
//       ) : (
//         <input
//           type="file"
//           className="file-input file-input-bordered w-full max-w-xs file-input-sm"
//           onChange={onUpload}
//         />
//       )}
//       <div
//         className="tooltip text-sm"
//         data-tip="Files you upload are only available temporarily. We do not store anything locally or online."
//       >
//         Where is my file stored?
//       </div>
//     </div>
//   );
// }

// function EditInEditor() {
//   return (
//     <div className="text-sm text-gray-600 alert">
//       Edit this value in the editor
//     </div>
//   );
// }

// function RecipeDocObjectParam({
//   paramSchema,
//   paramPath,
//   isQueryParam,
// }: {
//   paramSchema: RecipeObjectParam;
//   paramPath: string;
//   isQueryParam?: boolean;
// }) {
//   const queryParams = useRecipeSessionStore((state) => state.queryParams);
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);

//   const paramState =
//     getValueInObjPath<Record<string, unknown>>(
//       isQueryParam ? queryParams : requestBody,
//       paramPath
//     ) || {};

//   if (Object.keys(paramSchema.objectSchema).length === 0) {
//     return <EditInEditor />;
//   }

//   return (
//     <div className="border border-slate-200 dark:border-slate-600 border-dashed rounded p-4 space-y-2 w-full">
//       {Object.keys(paramState).map((innerParamName) => {
//         const innerParamSchema = paramSchema.objectSchema.find(
//           (param) => param.name === innerParamName
//         )!;
//         return (
//           <div
//             key={innerParamName}
//             className="flex min-w-52 flex-col space-y-2"
//           >
//             <div>{innerParamName}</div>
//             <RecipeDocParamEdit
//               paramSchema={innerParamSchema}
//               paramPath={`${paramPath}.${innerParamName}`}
//               isQueryParam={isQueryParam}
//             />
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function RecipeDocArrayParam({
//   paramSchema,
//   paramPath,
//   isQueryParam,
// }: {
//   paramSchema: RecipeArrayParam;
//   paramPath: string;
//   isQueryParam?: boolean;
// }) {
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);
//   const queryParams = useRecipeSessionStore((state) => state.queryParams);
//   const updateRequestBody = useRecipeSessionStore(
//     (state) => state.updateRequestBody
//   );
//   const updateQueryParams = useRecipeSessionStore(
//     (state) => state.updateQueryParams
//   );

//   const paramState =
//     getValueInObjPath<unknown[]>(
//       isQueryParam ? queryParams : requestBody,
//       paramPath
//     ) || [];

//   const updateParams = isQueryParam ? updateQueryParams : updateRequestBody;

//   let objectParams: RecipeParam[] = [];
//   const loadingTemplate = useRecipeSessionStore(
//     (state) => state.loadingTemplate
//   );

//   if ("objectSchema" in paramSchema.arraySchema) {
//     objectParams = paramSchema.arraySchema.objectSchema;
//   }

//   return (
//     <div className="">
//       <div
//         className={classNames(
//           paramState.length > 0 &&
//             "mb-2 space-y-2 border border-slate-200 dark:border-slate-600 rounded-sm p-2",
//           loadingTemplate && "flex flex-col-reverse"
//         )}
//       >
//         {paramState?.map((paramInfo, index) => {
//           const currentParams = Object.keys(
//             paramInfo as Record<string, unknown>
//           );

//           const missingParams = objectParams.filter((param) => {
//             if (!("name" in param)) return false;

//             return !currentParams.includes(param.name as string);
//           });

//           const innerParamPath = `${paramPath}.[${index}]`;

//           return (
//             <div key={index}>
//               <div className="flex items-center space-x-2 w-full">
//                 <RecipeDocParamEdit
//                   paramSchema={paramSchema.arraySchema}
//                   paramPath={innerParamPath}
//                   isQueryParam={isQueryParam}
//                 />
//                 <div className="flex flex-col">
//                   <button
//                     className="btn btn-xs"
//                     onClick={() => {
//                       const newParamState = [...paramState];
//                       newParamState.splice(index, 1);

//                       updateParams({
//                         path: paramPath,
//                         value:
//                           newParamState.length > 0 ? newParamState : undefined,
//                       });
//                     }}
//                   >
//                     <XMarkIcon className="w-3 h-3" />
//                   </button>
//                   {missingParams.length > 0 && (
//                     <>
//                       {missingParams.map((param) => {
//                         if (!("name" in param)) return null;

//                         return (
//                           <button
//                             key={param.name as string}
//                             className="btn btn-xs tooltip tooltip-left"
//                             data-tip={`"${param.name}" was optional. Want to add it?`}
//                             onClick={() => {
//                               updateParams({
//                                 path: `${paramPath}.[${index}].${param.name}`,
//                                 value: getDefaultValue(param),
//                               });
//                             }}
//                           >
//                             <EyeSlashIcon className="w-h h-3" />
//                           </button>
//                         );
//                       })}
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//       <div
//         className="tooltip tooltip-right"
//         data-tip="This parameter expects a list of items. Clicking add will add a new array item."
//       >
//         <button
//           className="btn btn-neutral btn-sm"
//           onClick={() => {
//             const defaultParam = getDefaultValue(paramSchema.arraySchema);

//             updateParams({
//               path: paramPath,
//               value: [...paramState, defaultParam],
//             });
//           }}
//         >
//           Add new item
//         </button>
//       </div>
//     </div>
//   );
// }

// export function getVariedParamInfo(paramSchema: RecipeVariedParam) {
//   const paramTypes = getParamTypes(paramSchema);

//   // This is the best index to use for the enum
//   const enumVariantIndex = paramSchema.variants.findIndex(
//     (variant) => "enum" in variant
//   );

//   return {
//     isEnumButSingleType:
//       paramTypes.length === 1 &&
//       (paramSchema.type === RecipeParamType.AnyOf ||
//         paramSchema.type === RecipeParamType.OneOf) &&
//       enumVariantIndex !== -1,
//     paramTypes,
//     enumVariantIndex,
//   };
// }

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

// // These docs are more simplified and don't need as much as queryParams or requestBody so opting to do it all here
// function RecipeUrlDocsContainer({
//   urlParamsSchema,
//   showHeader,
// }: {
//   urlParamsSchema: RecipeObjectSchemas;
//   showHeader: boolean;
// }) {
//   const urlParams = useRecipeSessionStore((state) => state.urlParams);
//   const updateUrlParams = useRecipeSessionStore(
//     (state) => state.updateUrlParams
//   );

//   const loadingTemplate = useRecipeSessionStore(
//     (state) => state.loadingTemplate
//   );

//   return (
//     <div className={classNames("my-4")}>
//       {showHeader && <h3 className="mb-2 text-sm">Url Params</h3>}
//       {urlParamsSchema.map((paramSchema) => {
//         const paramName = paramSchema.name;
//         const value = urlParams[paramName] as string | undefined;

//         if (loadingTemplate && value === undefined) {
//           return null;
//         }

//         return (
//           <div
//             className={classNames(
//               "border border-slate-200 dark:border-slate-600 rounded-sm p-4",
//               loadingTemplate && "animate-pulse dark:text-white"
//             )}
//             key={paramName}
//           >
//             <div className="flex justify-between items-center">
//               <RecipeDocObjectDefinition
//                 paramName={paramName}
//                 paramSchema={paramSchema}
//               />
//             </div>
//             {paramSchema.description && (
//               <ReactMarkdown
//                 className="text-sm mt-2"
//                 components={{
//                   a: (props) => (
//                     <a {...props} className="text-blue-600 underline" />
//                   ),
//                 }}
//               >
//                 {paramSchema.description}
//               </ReactMarkdown>
//             )}

//             <div className="mt-4">
//               {!("enum" in paramSchema) ? (
//                 <input
//                   className="input input-bordered input-sm w-full"
//                   placeholder={
//                     paramSchema.default
//                       ? `example: ${paramSchema.default}`
//                       : undefined
//                   }
//                   value={(value || "") as string}
//                   onChange={(e) => {
//                     updateUrlParams({
//                       path: paramName,
//                       value: e.target.value,
//                     });
//                   }}
//                 />
//               ) : (
//                 <select
//                   className="select select-bordered select-sm w-full max-w-xs"
//                   value={value || ""}
//                   onChange={(e) => {
//                     updateUrlParams({
//                       path: paramName,
//                       value: e.target.value,
//                     });
//                   }}
//                 >
//                   <option className="none"></option>
//                   {paramSchema.enum?.map((value) => {
//                     return <option key={value}>{value}</option>;
//                   })}
//                 </select>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
