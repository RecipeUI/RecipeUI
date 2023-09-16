import { AuthConfig } from "types/database";

export enum CollectionModule {
  NASA = "NASA",
}

export enum CollectionComponentModule {
  Header = "Header",
  Custom = "Custom",
  Resources = "Resources",
}

const modules = Object.values(CollectionModule);

export function isCollectionModule(value?: string): value is CollectionModule {
  if (value === undefined) return false;

  return modules.includes(value as CollectionModule);
}

export interface ResourceSection {
  title: string;
  description?: string;
  docs: {
    title?: string;
    url: string;
  }[];
}

export interface ModuleSetting {
  module: CollectionModule;
  title: string;
  description: string;
  image?: string;
  authConfigs: AuthConfig[] | null;
  resources?: ResourceSection;
  components: CollectionComponentModule[];
  urls: string[];
}
