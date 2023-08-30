import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { Recipe, RecipeOutputType } from "types/database";
import {
  DB_FUNC_ERRORS,
  FORM_LINKS,
  UNIQUE_ELEMENT_IDS,
} from "../../../utils/constants/main";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";
import classNames from "classnames";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { ReactNode, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createTemplate } from "./actions";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "types/enums";
import { useIsTauri } from "../../../hooks/useIsTauri";
import {} from "../../../utils/main";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import { useOutput } from "../../../state/apiSession";

export function RecipeSaveButton() {
  const currentSesssion = useRecipeSessionStore(
    (state) => state.currentSession
  );
  const {
    output: { type },
  } = useOutput(currentSesssion?.id);

  const isSending = useRecipeSessionStore((state) => state.isSending);
  const hasValidResponse = type === RecipeOutputType.Response;
  const user = useRecipeSessionStore((state) => state.user);

  const [showCreationFlow, setShowCreationFlow] = useState(false);

  if (!hasValidResponse || isSending) {
    return null;
  }
  return null;

  return (
    <>
      <div
        className="hidden sm:block tooltip tooltip-left tooltip-info"
        data-tip="Convert to a reusable recipe and share with people!"
      >
        <button
          className={classNames(
            "btn dark:text-white sm:w-24 w-full",
            "bg-chefYellow !text-black hover:btn-info"
          )}
          type="button"
          onClick={() => {
            if (!user) {
              document.getElementById(UNIQUE_ELEMENT_IDS.SIGN_IN)?.click();
              return;
            }

            setShowCreationFlow(true);
          }}
        >
          Save
        </button>
      </div>
      {/* {showCreationFlow && (
        <RecipeCreationFlow
          onClose={() => {
            setShowCreationFlow(false);
          }}
        />
      )} */}
    </>
  );
}

interface RecipeCreateFormData {
  title: string;
  description: string;
}

// export function RecipeCreationFlow({ onClose }: { onClose: () => void }) {
//   const user = useRecipeSessionStore((state) => state.user)!;
//   const recipe = useContext(RecipeContext)!;
//   const requestBody = useRecipeSessionStore((state) => state.requestBody);
//   const queryParams = useRecipeSessionStore((state) => state.queryParams);
//   const urlParams = useRecipeSessionStore((state) => state.urlParams);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<RecipeCreateFormData>({
//     defaultValues: {},
//   });

//   const [loading, setLoading] = useState(false);
//   const [newTemplateId, setNewTemplateId] = useState<string | null>(null);
//   const posthog = usePostHog();

//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const { output, duration } = useRecipeSessionStore((state) =>
//     state.getOutput()
//   );

//   useEffect(() => {
//     () => {
//       onClose();
//     };
//   }, []);
//   const supabase = useSupabaseClient();

//   const onSubmit = handleSubmit(async (data) => {
//     setLoading(true);

//     try {
//       const { newTemplate, error } = await createTemplate(
//         {
//           author_id: user.user_id,
//           original_author_id: user.user_id,
//           project: recipe.project,
//           recipe_id: recipe.id,
//           requestBody,
//           queryParams,
//           urlParams,
//           replay:
//             recipe.auth !== null && duration
//               ? {
//                   output,
//                   streaming: recipe.options?.streaming ?? false,
//                   duration: Math.floor(duration),
//                 }
//               : null,
//           ...data,
//         },
//         supabase
//       );

//       if (newTemplate) {
//         posthog.capture(POST_HOG_CONSTANTS.TEMPLATE_CREATE, {
//           template_id: newTemplate.id,
//           template_project: newTemplate.project,
//           recipe_id: recipe.id,
//           recipe_path: recipe.path,
//         });

//         setNewTemplateId(newTemplate.id);
//       } else if (error === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED) {
//         setErrorMsg(
//           "We love that you're making so many recipes but we're currently limiting users to 10 recipes right now to scale properly. Please delete some recipes and try again."
//         );
//       }
//     } catch (e) {
//       alert("Recipe failed to make");
//       console.error(e);
//     }

//     setLoading(false);
//   });

//   return (
//     <Dialog open={true} onClose={onClose} className="relative z-50">
//       <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

//       <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
//         <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[500px]">
//           {!newTemplateId ? (
//             <>
//               <Dialog.Title className="text-2xl font-bold ">
//                 {`New Recipe`}
//               </Dialog.Title>
//               <Dialog.Description
//                 as="div"
//                 className="p-4 text-sm border rounded-md my-2"
//               >
//                 <h3 className="font-bold text-base">
//                   {`Recipe fork of "${recipe.title}"`}
//                 </h3>
//                 <h3 className="">{recipe.path}</h3>
//                 <p className="line-clamp-2 text-xs mt-1">{recipe.summary}</p>
//               </Dialog.Description>

//               <form
//                 className="flex flex-col space-y-2  rounded-md mt-4"
//                 onSubmit={onSubmit}
//               >
//                 <>
//                   <LabelWrapper label="Recipe Title">
//                     <input
//                       className="input input-bordered w-full"
//                       {...register("title", { required: true })}
//                     />
//                   </LabelWrapper>
//                   <LabelWrapper label="Recipe Description">
//                     <input
//                       className="input  input-bordered w-full"
//                       {...register("description", { required: true })}
//                     />
//                   </LabelWrapper>

//                   {(errors.title || errors.description) && (
//                     <p className="alert alert-error !mt-4">
//                       Please fill out all required fields.
//                     </p>
//                   )}

//                   {errorMsg && (
//                     <div className="alert alert-error !mt-4 flex flex-col items-start">
//                       <p>{errorMsg}</p>
//                       <p>Want to be an early RecipeUI power user?</p>
//                       <a
//                         href={FORM_LINKS.RECIPEUI_PRO}
//                         target="_blank"
//                         className="underline underline-offset-2 -mt-4"
//                       >
//                         Sign up here.
//                       </a>
//                     </div>
//                   )}
//                 </>

//                 <button
//                   type="submit"
//                   className={classNames(
//                     "btn bg-chefYellow !mt-8 text-black",
//                     loading && "btn-disabled"
//                   )}
//                 >
//                   Save
//                   {loading && <span className="loading loading-bars"></span>}
//                 </button>
//               </form>
//             </>
//           ) : (
//             <SuccessAnimation onClose={onClose} newTemplateId={newTemplateId} />
//           )}
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// }

export function SuccessAnimation({
  onClose,
  newTemplateId,
  passiveRecipe,
  ignoreAnimation,
}: {
  onClose: () => void;
  newTemplateId: string;
  passiveRecipe?: Pick<Recipe, "title" | "id" | "method">;
  ignoreAnimation?: boolean;
}) {
  const router = useRouter();
  const recipe = useContext(RecipeContext)! ?? passiveRecipe!;
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const queryClient = useQueryClient();
  const isTauri = useIsTauri();
  const searchParams = useSearchParams();

  useEffect(() => {
    setTimeout(
      () => {
        const needsSession = passiveRecipe != null;

        setBodyRoute(RecipeBodyRoute.Templates);
        if (isTauri) {
          queryClient.invalidateQueries({
            queryKey: [QueryKey.RecipesHomeView, currentSession?.recipeId],
          });
        } else {
          if (needsSession) {
            // const newSession = addSession(recipe);
          } else {
            const newParams = new URLSearchParams(
              (searchParams as unknown as URLSearchParams) || undefined
            );
            newParams.set("newTemplateId", String(newTemplateId));
            router.push(`/?${newParams.toString()}`);
          }
        }
        onClose();
      },
      ignoreAnimation === true ? 0 : 4000
    );
  }, [isTauri]);

  return <img src={"/animated.gif"} alt="visual" className="w-full h-full" />;
}

function LabelWrapper({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="label text-sm">{label}</label>
      {children}
    </div>
  );
}
