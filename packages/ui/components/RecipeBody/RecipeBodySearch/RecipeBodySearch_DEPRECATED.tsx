// "use client";

// import { useCombobox } from "downshift";
// import classNames from "classnames";
// import Fuse from "fuse.js";
// import { useContext, useEffect, useMemo, useRef, useState } from "react";
// import { RouteTypeLabel } from "../../RouteTypeLabel";

// import { useDebounce } from "usehooks-ts";
// import {
//   RecipeBodyRoute,
//   RecipeContext,
//   useRecipeSessionStore,
// } from "../../../state/recipeSession";
// import { RecipeSearchButton } from "./RecipeSearchButton";
// import { useRouter } from "next/navigation";
// import { getURLParamsForSession } from "../../../utils/main";
// import { RecipeSaveButton } from "./RecipeSaveButton";
// import { useLoadingTemplate } from "./useLoadingTemplate";
// import { useQuery } from "@tanstack/react-query";
// import { QueryKey } from "types/enums";
// import { Database, Recipe } from "types/database";
// import { useIsTauri } from "../../../hooks/useIsTauri";
// import { useSupabaseClient } from "../../Providers/SupabaseProvider";

// interface RecipeSearchExtended extends Recipe {
//   label: string;
// }

// export function RecipeBodySearch() {
//   const addSession = useRecipeSessionStore((state) => state.addSession);
//   const currentSession = useRecipeSessionStore((state) => state.currentSession);
//   const setCurrentSession = useRecipeSessionStore(
//     (state) => state.setCurrentSession
//   );

//   const loadingTemplate = useRecipeSessionStore(
//     (state) => state.loadingTemplate
//   );
//   const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);
//   const supabase = useSupabaseClient();

//   const [recipes, setRecipes] = useState<RecipeSearchExtended[]>([]);

//   const recipeQuery = useQuery({
//     queryKey: [QueryKey.RecipesView],
//     queryFn: async () => {
//       const response = await supabase.from("recipe_view").select();
//       const newRecipes = ((response.data || []) as Recipe[]).map((r) => ({
//         ...r,
//         label: `${r.project} ${r.title}`,
//       }));
//       setRecipes(newRecipes);

//       return newRecipes;
//     },
//   });
//   const _recipes = useMemo(() => {
//     return recipeQuery.data || [];
//   }, [recipeQuery.data]);

//   const router = useRouter();
//   const currentSessionRecipe = useContext(RecipeContext);

//   const {
//     isOpen,
//     getMenuProps,
//     getInputProps,
//     highlightedIndex,
//     openMenu,
//     selectedItem: selectedRecipe,
//     getItemProps,
//     setInputValue,
//     inputValue,
//   } = useCombobox({
//     id: "recipe-search",
//     items: recipes,
//     itemToString(item) {
//       return item ? item.path : "";
//     },
//     selectedItem: currentSessionRecipe || null,
//     onSelectedItemChange: ({ selectedItem }) => {
//       if (selectedItem) {
//         const newSession = addSession(selectedItem);
//         router.push(`/?${getURLParamsForSession(newSession)}`);
//       }
//     },
//   });

//   const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

//   const ref = useRef<HTMLInputElement>(null);
//   const isTauri = useIsTauri();
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if ((event.metaKey || event.ctrlKey) && event.key === "k") {
//         event.preventDefault();

//         if (currentSession !== null) {
//           setCurrentSession(null, false);
//           setInputValue("");

//           if (isTauri) {
//             setDesktopPage(null);
//           } else {
//             router.push("/");
//           }
//         } else {
//           openMenu();
//         }
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);

//     // Remove the keydown event listener when the component unmounts
//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [openMenu, currentSession, isTauri]);

//   const recipeSearch = useMemo(() => {
//     return new Fuse(_recipes, {
//       keys: ["summary", "path", "label"],
//       threshold: 0.4,
//       sortFn: (a, b) => {
//         const a_tags = (_recipes[a.idx].tags || []).length;
//         const b_tags = (_recipes[b.idx].tags || []).length;

//         if (a_tags > b_tags) return -1;
//         else if (a_tags < b_tags) return 1;

//         return a.score - b.score;
//       },
//     });
//   }, [_recipes]);

//   const debouncedInputValue = useDebounce(inputValue, 300);
//   useEffect(() => {
//     if (!debouncedInputValue) {
//       setRecipes(_recipes);
//       return;
//     }
//     const items = recipeSearch.search(debouncedInputValue).map((r) => {
//       return r.item;
//     });
//     setRecipes(items);
//   }, [debouncedInputValue, recipeSearch]);

//   useLoadingTemplate();

//   return (
//     <div
//       className={classNames(
//         "p-4",
//         (bodyRoute === RecipeBodyRoute.Templates || loadingTemplate) &&
//           "py-2 sm:py-4"
//       )}
//     >
//       <div
//         className={classNames(
//           "flex flex-col relative",
//           (currentSession == null ||
//             bodyRoute === RecipeBodyRoute.Templates ||
//             loadingTemplate) &&
//             "hidden sm:block"
//         )}
//       >
//         <div className="flex space-x-2 sm:flex sm:space-x-2 sm:flex-row">
//           <div
//             className={classNames(
//               "input input-bordered flex-1 flex items-center space-x-2 py-4 sm:mb-0 border-slate-200 dark:border-slate-600"
//             )}
//             data-tip={
//               currentSession
//                 ? "You cannot edit a recipe URL. Start a new session with CMD+K"
//                 : ""
//             }
//           >
//             {selectedRecipe?.method && (
//               <RouteTypeLabel recipeMethod={selectedRecipe.method} />
//             )}
//             <input
//               ref={ref}
//               onClick={() => {
//                 if (!isOpen) openMenu();
//               }}
//               placeholder="Start typing here to search.... (Shortcut: CMD+K)"
//               className={classNames(
//                 "outline-none w-full dark:bg-transparent"
//                 // currentSession && "pointer-events-none"
//               )}
//               {...getInputProps()}
//               {...(currentSession && { value: selectedRecipe?.path })}
//             />
//           </div>
//           {currentSession != null && currentSessionRecipe != null && (
//             <div className="grid grid-flow-col gap-x-2">
//               <RecipeSearchButton />
//               <RecipeSaveButton />
//             </div>
//           )}
//         </div>
//         <ul
//           className={classNames(
//             "w-full mt-2 shadow-md max-h-80 overflow-auto  rounded-md border z-10 border-slate-200",
//             !isOpen && "hidden",
//             currentSession && "hidden"
//           )}
//           {...getMenuProps()}
//         >
//           {isOpen && (
//             <>
//               {recipes.map((recipe, index) => {
//                 return (
//                   // eslint-disable-next-line react/jsx-key
//                   <li
//                     className={classNames(
//                       selectedRecipe?.path === recipe.path &&
//                         highlightedIndex !== index &&
//                         "bg-gray-300",
//                       highlightedIndex === index &&
//                         "bg-blue-300 dark:!bg-neutral-700",
//                       "py-2 px-4 shadow-sm flex space-x-2 dark:bg-neutral-800"
//                     )}
//                     key={recipe.title + recipe.method + recipe.project}
//                     {...getItemProps({
//                       index,
//                       item: recipe,
//                     })}
//                   >
//                     <RouteTypeLabel recipeMethod={recipe.method} />
//                     <div className="flex-1">
//                       <div className="text-base dark:text-gray-300 line-clamp-1">
//                         {recipe.title}
//                         {recipe.summary && `: ${recipe.summary}`}
//                       </div>
//                       <div className="  space-x-2 text-sm text-gray-600  dark:text-gray-400">
//                         <span>{recipe.path}</span>
//                         {recipe.tags?.map((tag) => (
//                           <div
//                             className="badge badge-neutral badge-sm"
//                             key={tag}
//                           >
//                             {tag}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </li>
//                 );
//               })}
//               {Boolean(recipes.length === 0 && debouncedInputValue) && (
//                 <li className="py-2 px-4 shadow-sm flex sm:space-x-2 dark:bg-neutral-600">
//                   <div className="flex-1">
//                     <div className="text-base">
//                       <span className="">No recipes found for </span>
//                       <span>{`"${debouncedInputValue}". `}</span>
//                       <span>
//                         {"We'll constantly add new recipes from the community!"}
//                       </span>
//                     </div>
//                   </div>
//                 </li>
//               )}
//             </>
//           )}
//         </ul>
//       </div>
//     </div>
//   );
// }
