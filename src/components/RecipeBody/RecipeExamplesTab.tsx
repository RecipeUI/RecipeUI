import {
  RecipeBodyRoute,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeMutationCore } from "../../types/recipes";

export function RecipeExamplesTab() {
  const selectedRecipe = useRecipeSessionStore(
    (state) => state.currentSession!.recipe as RecipeMutationCore
  );
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);

  const examples = selectedRecipe.examples || [];

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto">
        <h1 className="text-xl font-bold">Examples</h1>
        <p className="mt-2">
          Use some of examples below to quickly prefill the editor.
        </p>
        <div className="flex-1 grid grid-cols-2 gap-2 mt-4">
          {examples.map((example) => {
            return (
              <div
                className="border rounded-sm p-4 space-y-2"
                key={`${example.title}${example.author}`}
              >
                <h3 className="font-bold">{example.title}</h3>
                <p className="text-sm line-clamp-3">{example.description}</p>
                <button
                  className="btn btn-sm btn-neutral"
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
