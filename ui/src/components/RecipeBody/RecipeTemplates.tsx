import { useContext } from "react";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeMutationCore } from "@/types/databaseExtended";

export function RecipeTemplatesTab() {
  const selectedRecipe = useContext(RecipeContext)!;

  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);
  const templates = selectedRecipe.templates || [];

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto">
        <h1 className="text-xl font-bold">Recipes</h1>
        <p className="mt-2">
          Use some of these recipes below to quickly prefill the editor. You can
          also create your own!
        </p>
        <div className="flex-1 grid grid-cols-2 gap-2 mt-4">
          {templates.map((template) => {
            return (
              <div
                className="border rounded-sm p-4 space-y-2 flex flex-col"
                key={`${template.title}${template.author}`}
              >
                <h3 className="font-bold">{template.title}</h3>
                <p className="text-sm line-clamp-3">{template.description}</p>
                <div className="flex-1" />
                <button
                  className="btn btn-sm btn-neutral w-fit"
                  onClick={() => {
                    if (template.requestBody) {
                      setRequestBody(template.requestBody);
                    }

                    if (template.queryParams) {
                      setQueryParams(template.queryParams);
                    }

                    if (template.urlParams) {
                      setUrlParams(template.urlParams);
                    }

                    setBodyRoute(RecipeBodyRoute.Parameters);
                  }}
                >
                  Use
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
