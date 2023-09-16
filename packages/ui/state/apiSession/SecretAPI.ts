"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSecretStore } from ".";
import { AuthConfig } from "types/database";
import { CollectionModule } from "../../modules";
import { ModuleToConfigs } from "../../modules/authConfigs";

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

  static getComplexSecrets = async ({
    collection,
  }: {
    collection: CollectionModule;
  }) => {
    let authConfigs = ModuleToConfigs[collection];

    if (!authConfigs) {
      alert("No auth configs found for collection: " + collection);
      return {};
    }

    const secretRecord: Record<string, string | undefined> = {};

    let hasAuthSetup = true;

    await Promise.all(
      authConfigs.map(async (authConfig) => {
        const secretId = this.getSecretKeyFromConfig(authConfig, collection);
        secretRecord[secretId] = await this.getSecret({ secretId });

        if (!secretRecord[secretId]) hasAuthSetup = false;
      })
    );

    return { secretRecord, hasAuthSetup };
  };

  static getSecretKeyFromConfig(authConfig: AuthConfig, prefix: string) {
    return `${prefix}::${authConfig.type}::${authConfig.payload.name}`;
  }
}

interface SaveSecret {
  secretId: string;
  secretValue: string;
}

export function useSecret({ secretId }: { secretId: string }) {
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

interface ComplexSecretProps {
  collection: CollectionModule;
  onSave?: (secrets: Record<string, string | undefined>) => void;
}
export function useComplexSecrets({ collection, onSave }: ComplexSecretProps) {
  const [secretRecord, setSecretRecord] = useState<
    Record<string, string | undefined>
  >({});
  const [hasAuthSetup, setHasAuthSetup] = useState<boolean>(false);

  const refreshSecrets = useCallback(async () => {
    const response = await SecretAPI.getComplexSecrets({
      collection,
    });
    if (response.secretRecord) {
      setSecretRecord(response.secretRecord);
      setHasAuthSetup(response.hasAuthSetup);

      onSave?.(response.secretRecord);
    }

    // Do not add onSave to dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  useEffect(() => {
    refreshSecrets();
  }, [refreshSecrets]);

  const updateSecrets = useCallback(
    async (saveSecrets: SaveSecret[]) => {
      await Promise.all(
        saveSecrets.map(async (saveSecret) => {
          await SecretAPI.saveSecret(saveSecret);
        })
      );

      await refreshSecrets();
    },
    [refreshSecrets]
  );

  const authConfigs = useMemo(() => {
    return ModuleToConfigs[collection] || [];
  }, [collection]);

  return {
    secretRecord,
    updateSecrets,
    hasAuthSetup,
  };
}
