import { ModuleSetting } from "types/database";
import { RecipeAuthType } from "types/enums";
import { CollectionModule } from "types/modules";

export default {
  module: CollectionModule.Unsplash,
  title: "Unsplash",
  description: "The Internet's Source for Visuals.",
  image:
    "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/unsplash.png",
  authConfig: {
    type: RecipeAuthType.Header,
    payload: {
      name: "Authorization",
      prefix: "Client-ID",
      description:
        "You can get your access key by reading our [docs](https://docs.recipeui.com/docs/Auth/Unsplash) or visiting your [apps](https://unsplash.com/oauth/applications) in Unsplash.",
    },
  } as const,
  resources: {
    title: "Resources",
    docs: [
      {
        title: "Official Unsplash Docs",
        url: "https://unsplash.com/documentation",
      },
      {
        title: "Unsplash Your Apps",
        url: "https://unsplash.com/oauth/applications",
      },
      {
        title: "[RecipeUI] Unsplash Auth Guide",
        url: "https://docs.recipeui.com/docs/Auth/Unsplash",
      },
    ],
  },
  urls: ["https://api.unsplash.com"],
} satisfies ModuleSetting;
