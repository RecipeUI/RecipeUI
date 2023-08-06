import { produce } from "immer";
import { useLocalStorage } from "usehooks-ts";
import { useMemo } from "react";

// TODO: This is pretty bad but lets think of something later in the future
const SECRET_KEY = "RECIPE_SECRET";
export interface SecretsManager {
  [projectKey: string]: string;
}

export function useSecretManager() {
  const [sm, setSm] = useLocalStorage<SecretsManager>(SECRET_KEY, {});
  const updateSecret = (projectKey: string, newValue: string) => {
    const newSm = produce(sm, (draft) => {
      draft[projectKey] = newValue;
    });
    setSm(newSm);
  };

  const deleteSecret = (projectKey: string) => {
    const newSm = produce(sm, (draft) => {
      delete draft[projectKey];
    });
    setSm(newSm);
  };

  const getSecret = (projectKey: string): string | undefined => {
    return sm[projectKey];
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

export function useSecretFromSM(projectKey: string) {
  const sm = useSecretManager();
  return useMemo(() => sm.getSecret(projectKey), [sm, projectKey]);
}
