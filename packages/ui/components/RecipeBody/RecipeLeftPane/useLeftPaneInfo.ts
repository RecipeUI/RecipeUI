import { useContext, useMemo } from "react";
import {
  RecipeContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";

export function useLeftPaneInfo() {
  const selectedRecipe = useContext(RecipeContext)!;

  const requestBody = useRecipeSessionStore((state) => state.requestBody);
  const queryParams = useRecipeSessionStore((state) => state.queryParams);
  const urlParams = useRecipeSessionStore((state) => state.urlParams);

  const {
    hasNoAuth,
    needsAuthSetup,
    hasRequiredBodyParams,
    hasRequestBody,
    hasQueryParams,
    hasRequiredQueryParams,
    hasUrlParams,
  } = useMemo(() => {
    const needsAuthSetup = true;

    let hasRequiredBodyParams = false;
    let hasRequestBody = false;
    if (selectedRecipe.requestBody?.properties) {
      hasRequestBody = true;

      hasRequiredBodyParams = Boolean(
        selectedRecipe.requestBody.required &&
          selectedRecipe.requestBody.required.length > 0
      );
    }

    let hasQueryParams = false;
    let hasRequiredQueryParams = false;
    if ("queryParams" in selectedRecipe && selectedRecipe.queryParams != null) {
      hasRequiredQueryParams = Boolean(
        selectedRecipe.queryParams.required &&
          selectedRecipe.queryParams.required.length > 0
      );
      hasQueryParams = true;
    }

    const hasUrlParams =
      "urlParams" in selectedRecipe && selectedRecipe.urlParams != null;

    return {
      needsAuthSetup,
      hasRequiredBodyParams,
      hasRequestBody,
      hasQueryParams,
      hasRequiredQueryParams,
      hasUrlParams,
      hasNoAuth: false,
    };
  }, [selectedRecipe]);
  const hasRequestBodyPayload = Object.keys(requestBody).length > 0;
  const needsBodyParams = hasRequiredBodyParams && !hasRequestBodyPayload;

  const hasQueryParamPayload = Object.keys(queryParams).length > 0;
  const needsQueryParams = hasRequiredQueryParams && !hasQueryParamPayload;

  const hasUrlParamPayload = Object.keys(urlParams).length > 0;
  const needsUrlParams = hasUrlParams && !hasUrlParamPayload;

  const hasTemplates =
    selectedRecipe.templates != null ||
    (selectedRecipe.userTemplates && selectedRecipe.userTemplates.length > 0);
  const needsParams = needsBodyParams || needsUrlParams || needsQueryParams;
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const showingRecipes = hasTemplates && needsParams;
  const showOnboarding = !loadingTemplate && needsAuthSetup && !showingRecipes;
  const hasNoParams =
    !hasRequestBody && !hasQueryParams && !hasUrlParams && !loadingTemplate;

  const showingRecipesTwo = Boolean(
    loadingTemplate ||
      (!showOnboarding && needsAuthSetup) ||
      (!needsAuthSetup && needsParams)
  );

  return {
    hasNoAuth,
    needsAuthSetup,
    hasRequiredBodyParams,
    hasRequestBody,
    hasQueryParams,
    hasRequiredQueryParams,
    hasUrlParams,
    hasRequestBodyPayload,
    needsBodyParams,
    hasQueryParamPayload,
    needsQueryParams,
    hasUrlParamPayload,
    needsUrlParams,
    hasTemplates,
    needsParams,
    loadingTemplate,
    showingRecipes,
    showingRecipesTwo,
    showOnboarding,
    hasNoParams,
  };
}
