export const DARKTHEME_SETTINGS = {
  name: "recipeui-dark",
  config: {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#1d232a",
    },
  },
};

export const DEFAULT_MONACO_OPTIONS = {
  minimap: {
    enabled: false,
  },
  renderLineHighlight: "none",
  fixedOverflowWidgets: true,
} as const;
