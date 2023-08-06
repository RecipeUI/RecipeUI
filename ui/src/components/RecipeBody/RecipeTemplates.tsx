import {
  RecipeBodyRoute,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeMutationCore } from "@/types/databaseExtended";

export function RecipeTemplatesTab() {
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe as RecipeMutationCore
  );
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);

  const examples = selectedRecipe.examples || [];

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto">
        <h1 className="text-xl font-bold">Templates</h1>
        <p className="mt-2">
          Use some of these templates below to quickly prefill the editor. You
          can also create your own!
        </p>
        <div className="flex-1 grid grid-cols-2 gap-2 mt-4">
          {examples.map((example) => {
            return (
              <div
                className="border rounded-sm p-4 space-y-2 flex flex-col"
                key={`${example.title}${example.author}`}
              >
                <h3 className="font-bold">{example.title}</h3>
                <p className="text-sm line-clamp-3">{example.description}</p>
                <div className="flex-1" />
                <button
                  className="btn btn-sm btn-neutral w-fit"
                  onClick={() => {
                    if (example.requestBody) {
                      setRequestBody(example.requestBody);
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
