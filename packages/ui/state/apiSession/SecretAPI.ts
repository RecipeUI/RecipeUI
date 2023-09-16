"use client";
import { useCallback, useEffect, useState } from "react";
import { getSecretStore } from ".";

export class SecretAPI {
  static getSecret = async ({
    secretId,
  }: {
    secretId: string;
  }): Promise<string | undefined> => {
    const store = await getSecretStore();
    return store.get(String(secretId));
  };

  static saveSecret = async ({ secretId, secretValue }: SaveSecret) => {
    const store = await getSecretStore();
    store.put(secretValue, String(secretId));
  };

  static deleteSecret = async ({ secretId }: { secretId: string }) => {
    const store = await getSecretStore();
    store.delete(String(secretId));
  };
}

interface SaveSecret {
  secretId: string;
  secretValue: string;
}

export function useSecret(secretId: string) {
  const [secret, setSecret] = useState<string | undefined>(undefined);

  useEffect(() => {
    SecretAPI.getSecret({ secretId }).then((secret) => setSecret(secret));
  }, [secretId]);

  const _updateSecret = useCallback(
    ({ secretValue }: SaveSecret) => {
      SecretAPI.saveSecret({ secretId: secretId, secretValue });
      setSecret(secretValue);
    },
    [secretId]
  );

  const _deleteSecret = useCallback(() => {
    SecretAPI.deleteSecret({ secretId });
    setSecret(undefined);
  }, [secretId]);

  return {
    secret,
    updateSecret: _updateSecret,
    deleteSecret: _deleteSecret,
  };
}
