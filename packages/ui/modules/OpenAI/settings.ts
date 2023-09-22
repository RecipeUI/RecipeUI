import { ModuleSetting } from "types/database";
import { RecipeAuthType } from "types/enums";
import { CollectionComponentModule, CollectionModule } from "types/modules";

export default {
  module: CollectionModule.OpenAI,
  title: "OpenAI",
  description:
    "Harness the power of cutting-edge AI models. Integrate world-class natural language processing into your applications and transform the way you interact with data.",
  image:
    "https://nqtmsoehkjdrhcmzfjar.supabase.co/storage/v1/object/public/assets/projects/openai.png",
  authConfig: {
    type: RecipeAuthType.Header,
    payload: {
      name: "Authorization",
      prefix: "Bearer",
      description:
        "Bearer token for OpenAI API can be retrieved from [here](https://platform.openai.com/account/api-keys). You can read our [guide](https://docs.recipeui.com/docs/Auth/OpenAI) on how to get it.",
    },
  } as const,
  resources: {
    title: "Resources",
    docs: [
      {
        title: "Official OpenAI Docs",
        url: "https://platform.openai.com/docs/api-reference",
      },
      {
        title: "[RecipeUI] OpenAI Auth Guide",
        url: "https://docs.recipeui.com/docs/Auth/OpenAI",
      },
    ],
  },
  urls: ["https://api.openai.com/v1"],
  components: [
    CollectionComponentModule.Auth,
    CollectionComponentModule.Header,
    CollectionComponentModule.Resources,
    CollectionComponentModule.Custom2,
  ],
} satisfies ModuleSetting;
