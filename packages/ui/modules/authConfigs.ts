import { CollectionModule } from ".";
import { NASA_AUTH_CONFIG } from "./nasa/constants";

export const ModuleToConfigs = {
  [CollectionModule.NASA]: NASA_AUTH_CONFIG,
};
