import { ModuleSetting } from "types/database";
import { RecipeAuthType } from "types/enums";
import { CollectionModule } from "types/modules";

export default {
  module: CollectionModule.GIPHY,
  title: "GIPHY",
  description:
    "Bring your platform to life! Embed GIPHY's vast library of animated GIFs to add fun, expression, and creativity to any digital experience.",
  image:
    "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/giphy.png",
  authConfig: {
    type: RecipeAuthType.Query,
    payload: {
      name: "api_key",
      description:
        "Your GIPHY API key obtained from your [developer dashboard](https://developers.giphy.com/dashboard/). You can read our [guide](https://docs.recipeui.com/docs/Auth/GIPHY) on how to get it.",
    },
  } as const,
  resources: {
    title: "Resources",
    docs: [
      {
        title: "Official GIPHY Docs",
        url: "https://developers.giphy.com/docs/api/#quick-start-guide",
      },
      {
        title: "[RecipeUI] GIPHY Auth Guide",
        url: "https://docs.recipeui.com/docs/Auth/giphy",
      },
    ],
  },
  urls: ["https://api.giphy.com"],
} satisfies ModuleSetting;
