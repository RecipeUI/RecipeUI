export enum CollectionModule {
  NASA = "NASA",
  GIPHY = "GIPHY",
  OpenAI = "OpenAI",
  Unsplash = "Unsplash",
}

export enum CollectionComponentModule {
  Header = "Header",
  Custom = "Custom",
  Resources = "Resources",
}

export const modules = Object.values(CollectionModule);

export const DEFAULT_COMPONENT_MODULES = [
  CollectionComponentModule.Custom,
  CollectionComponentModule.Header,
  CollectionComponentModule.Resources,
];

export interface ResourceSection {
  title: string;
  description?: string;
  docs: {
    title?: string;
    url: string;
  }[];
}
