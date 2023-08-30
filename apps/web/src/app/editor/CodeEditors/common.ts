export const DARKTHEME_SETTINGS = {
  name: "recipeui-dark",
  config: {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1d232a",
    },
  } as const,
};

export const LIGHTTHEME_SETTINGS = {
  name: "recipeui-light",
  config: {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#fafafa",
    },
  } as const,
};

export const DEFAULT_MONACO_OPTIONS = {
  minimap: {
    enabled: false,
  },
  renderLineHighlight: "none",
  fixedOverflowWidgets: true,
} as const;

export enum EditorParamView {
  Query = "query",
  Body = "body",
  Url = "url",
}
