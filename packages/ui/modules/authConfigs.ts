// We need to make sure usages of this file are LAZY LOADED

import { CollectionModule, ModuleSetting } from ".";
import NASA_MODULE from "./NASA/settings";
import GIPHY_MODULE from "./GIPHY/settings";

export const ModuleSettings: Record<
  CollectionModule,
  ModuleSetting | undefined
> = {
  [CollectionModule.NASA]: NASA_MODULE,
  [CollectionModule.GIPHY]: GIPHY_MODULE,
};

const settings = Object.values(ModuleSettings);

export function pathModuleSetting(path?: string) {
  if (!path) return undefined;

  return settings.find((setting) =>
    setting?.urls.some((url) => path.includes(url))
  );
}
