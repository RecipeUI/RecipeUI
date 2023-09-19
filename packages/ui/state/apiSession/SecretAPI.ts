"use secret";

import { useCallback, useEffect, useMemo, useState } from "react";
import { eventEmitter, getSecretStore } from ".";
import { AuthConfig, SingleAuthConfig } from "types/database";
import { CollectionModule, isCollectionModule } from "../../modules";
import { ModuleSettings } from "../../modules/authConfigs";
import { RecipeAuthType } from "types/enums";

export class SecretAPI {
  static getSecret = async ({
    secretId,
  }: {
    secretId: string;
  }): Promise<string | undefined> => {
    const store = await getSecretStore();
    return store.get(secretId);
  };

  static saveSecret = async ({ secretId, secretValue }: SaveSecret) => {
    const store = await getSecretStore();
    store.put(secretValue, secretId);
  };

  static deleteSecret = async ({ secretId }: { secretId: string }) => {
    const store = await getSecretStore();
    const keys = await store.getAllKeys();

    for (const key of keys) {
      if (key.startsWith(secretId)) {
        await store.delete(key);
      }
    }
  };

  static getComplexSecrets = async ({
    collection,
  }: {
    collection: CollectionModule;
  }) => {
    let authConfigs: SingleAuthConfig[] = [];
    let initialConfig = ModuleSettings[collection]?.authConfigs;

    if (initialConfig) {
      if (initialConfig.type === RecipeAuthType.Multiple) {
        authConfigs = initialConfig.payload;
      } else {
        authConfigs = [initialConfig];
      }
    }

    if (authConfigs.length === 0) {
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

  static getSecretKeyFromConfig(authConfig: SingleAuthConfig, prefix: string) {
    return `${prefix}::${authConfig.type}::${authConfig.payload?.name}`;
  }
}

interface SaveSecret {
  secretId: string;
  secretValue: string;
}

interface ComplexSecretProps {
  collection?: string | CollectionModule;
  onSave?: (secrets: Record<string, string | undefined>) => void;
}
export function useComplexSecrets({ collection, onSave }: ComplexSecretProps) {
  const [secretRecord, setSecretRecord] = useState<
    Record<string, string | undefined>
  >({});
  const [hasAuthSetup, setHasAuthSetup] = useState<boolean>(false);

  useEffect(() => {
    async function refreshSecrets() {
      if (!collection || !isCollectionModule(collection)) {
        setSecretRecord({});
        setHasAuthSetup(false);
        return;
      }

      const response = await SecretAPI.getComplexSecrets({
        collection,
      });
      if (response.secretRecord) {
        setSecretRecord(response.secretRecord);
        setHasAuthSetup(response.hasAuthSetup);

        onSave?.(response.secretRecord);
      }
    }
    refreshSecrets();
    eventEmitter.on("refreshSecrets", refreshSecrets);

    return () => {
      eventEmitter.off("refreshSecrets", refreshSecrets);
    };

    // Do not add onSave to dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  const updateSecrets = useCallback(async (saveSecrets: SaveSecret[]) => {
    await Promise.all(
      saveSecrets.map(async (saveSecret) => {
        await SecretAPI.saveSecret(saveSecret);
      })
    );

    eventEmitter.emit("refreshSecrets");
  }, []);

  return {
    secretRecord,
    updateSecrets,
    hasAuthSetup,
  };
}
