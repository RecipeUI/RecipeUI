import { AuthConfig } from "types/database";
import { RecipeAuthType } from "types/enums";
import { SecretAPI } from "../../state/apiSession/SecretAPI";
import { CollectionModule } from "..";

export const NASA_QUERY_API_KEY_CONFIG = {
  type: RecipeAuthType.Query,
  payload: {
    name: "api_key",
  },
} as const;

export const NASA_AUTH_CONFIG: AuthConfig[] = [NASA_QUERY_API_KEY_CONFIG];

export const NASA_DEMO_KEY = "DEMO_KEY";
