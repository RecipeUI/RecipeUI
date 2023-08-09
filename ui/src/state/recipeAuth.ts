import { produce } from "immer";
import { useLocalStorage } from "usehooks-ts";
import { useContext, useMemo } from "react";
import { RecipeContext } from "@/state/recipeSession";
import { RecipeAuthType } from "@/types/databaseExtended";

// TODO: This is pretty bad but lets think of something later in the future
const SECRET_KEY = "RECIPE_SECRET";
export interface SecretsManager {
  [projectKey: string]: string;
}

interface SecretParams {
  project: string;
  auth: string;
}

export function useSecretManager() {
  const [sm, setSm] = useLocalStorage<SecretsManager>(SECRET_KEY, {});
  const updateSecret = (props: SecretParams, newValue: string) => {
    const newSm = produce(sm, (draft) => {
      draft[props.project + props.auth] = newValue;
    });
    setSm(newSm);
  };

  const deleteSecret = (props: SecretParams) => {
    const newSm = produce(sm, (draft) => {
      delete draft[props.project + props.auth];
    });
    setSm(newSm);
  };

  const getSecret = (props: SecretParams): string | undefined => {
    return sm[props.project + props.auth];
  };

  const clearSecrets = () => {
    setSm({});
  };

  return {
    clearSecrets,
    getSecret,
    updateSecret,
    deleteSecret,
  };
}

export function useSecretsFromSM() {
  const selectedRecipe = useContext(RecipeContext);
  const sm = useSecretManager();

  if (!selectedRecipe) return null;

  const secretRecord: Record<string, string | null> = {};
  if (selectedRecipe.auth !== RecipeAuthType.Custom) {
    const res = sm.getSecret({
      project: selectedRecipe.project,
      auth: selectedRecipe.auth!,
    });

    secretRecord[selectedRecipe.auth!] = res || null;
  }

  const { simpleHeaders } = getHeaderTypes(selectedRecipe.options?.auth || []);

  for (const header of simpleHeaders) {
    const res = sm.getSecret({
      project: selectedRecipe.project,
      auth: header,
    });

    secretRecord[header] = res || null;
  }

  let hasAllSecrets = Object.values(secretRecord).every((v) => v !== null);
  return { secrets: secretRecord, hasAllSecrets, simpleHeaders };
}

export function getHeaderTypes(headers: string[]) {
  const simpleHeaders = headers
    .filter((h) => h.startsWith("-h="))
    .map((h) => h.replace("-h=", "").trim());
  return {
    simpleHeaders,
  };
}
