import { ModuleSetting } from "types/database";
import { RecipeAuthType } from "types/enums";
import { CollectionComponentModule, CollectionModule } from "types/modules";

export default {
  module: CollectionModule.NASA,
  title: "NASA",
  description:
    "Use NASA's API to get the latest imagery and insights about Earth, Mars, and more about the Solar System.",
  image: "https://api.nasa.gov/assets/img/favicons/favicon-192.png",
  authConfig: {
    type: RecipeAuthType.Query,
    payload: {
      name: "api_key",
    },
  } as const,
  resources: {
    title: "Resources",
    docs: [
      {
        title: "Official NASA Docs",
        url: "https://api.nasa.gov/",
      },
      {
        title: "NASA API Github",
        url: "https://github.com/nasa/api-docs",
      },
      {
        title: "[RecipeUI] NASA Auth Guide",
        url: "https://docs.recipeui.com/docs/Auth/nasa",
      },
    ],
  },
  components: [
    CollectionComponentModule.Auth,
    CollectionComponentModule.Header,
    CollectionComponentModule.Resources,
  ],
  urls: ["https://api.nasa.gov"],
} satisfies ModuleSetting;
