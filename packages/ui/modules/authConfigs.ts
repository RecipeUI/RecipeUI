import { AuthConfig } from "types/database";
import { CollectionModule, ModuleSetting, ResourceSection } from ".";
import NASA_MODULE from "./nasa/settings";

export const ModuleSettings: Record<
  CollectionModule,
  ModuleSetting | undefined
> = {
  [CollectionModule.NASA]: NASA_MODULE,
};

const settings = Object.values(ModuleSettings);

export function pathModuleSetting(path?: string) {
  if (!path) return undefined;

  return settings.find((setting) =>
    setting?.urls.some((url) => path.includes(url))
  );
}
