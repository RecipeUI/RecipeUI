import { MergeDeep } from "type-fest";
import { Database as DatabaseGenerated } from "./database-generated.types";
export type { Json } from "./database-generated.types";
import {
  ProjectMemberRole,
  ProjectScope,
  ProjectVisibility,
  RecipeAuthType,
  RecipeMethod,
  RecipeMutationContentType,
  RecipeParamType,
  RecipeProjectStatus,
  Visibility,
} from "./enums";
import { JSONSchema6 } from "json-schema";

type Nullable<T> = T | null;

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        project: {
          Row: {
            status: RecipeProjectStatus;
          };
        };
        recipe: {
          Row: {
            templates: Nullable<RecipeTemplate[]>;
            options: Nullable<RecipeOptions>;
            method: RecipeMethod;
            requestBody: Nullable<JSONSchema6>;
            queryParams: Nullable<JSONSchema6>;
            urlParams: Nullable<JSONSchema6>;
            auth: Nullable<RecipeAuthType>;
          };
          Insert: {
            templates: Nullable<RecipeTemplate[]>;
            options: Nullable<RecipeOptions>;
            method: RecipeMethod;
            requestBody: Nullable<JSONSchema6>;
            queryParams: Nullable<JSONSchema6>;
            urlParams: Nullable<JSONSchema6>;
            auth: Nullable<RecipeAuthType>;
          };
        };
        template: {
          Row: {
            replay: Nullable<RecipeTemplateOutput>;
            project_scope: ProjectScope;
            headers: Nullable<RequestHeader[]>;
          } & NullableRecipeParams;
          Insert: {
            replay: Nullable<RecipeTemplateOutput>;
          } & NullableRecipeParams;
        };
      };

      Enums: {
        recipeprojectstatus: RecipeProjectStatus;
        recipemethod: RecipeMethod;
        projectvisibility: ProjectVisibility;
        visibility: Visibility;
        projectmemberrole: ProjectMemberRole;
        projectscope: ProjectScope;
      };
    };
  }
>;
export type NullableRecipeParams = {
  requestBody: Nullable<JSONBody>;
  queryParams: Nullable<JSONBody>;
  urlParams: Nullable<JSONBody>;
};

export type RecipeRequestBody = RecipeObjectParam & {
  contentType: RecipeMutationContentType;
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T];

export type UserCloud = {
  apis: Recipe[];
  collections: RecipeProject[];
  user_id: string;
};

export type User = Tables<"user">;
export type RecipeProject = Tables<"project">;
export type Recipe = Tables<"recipe"> & {
  userTemplates?: UserTemplatePreview[];
};

export type RecipeTemplateFragment = Omit<
  Tables<"template">,
  "alias" | "author_id" | "project" | "visibility"
>;

export interface AuthConfig {
  type: RecipeAuthType;
  payload: {
    name: string;
    prefix?: string;
    description?: string;
  };
}

export type RecipeOptions = {
  deprecated?: boolean;
  streaming?: boolean;
  auth?: AuthConfig[];
  docs?: {
    auth: string;
  };
};

export type RecipeReplay = RecipeParameters & RecipeTemplateOutput;

export interface JSONBody {
  [key: string]: unknown;
}

export interface RecipeParamCore<T = void> {
  type: RecipeParamType;
  nullable?: boolean;
  required?: boolean;
  description?: string;
  default?: T;
  example?: T;
}

export interface RecipeStringParam extends RecipeParamCore<string> {
  type: RecipeParamType.String;
  enum?: string[];
}

export interface RecipeBooleanParam extends RecipeParamCore<boolean> {
  type: RecipeParamType.Boolean;
}

export interface RecipeNumericalParam extends RecipeParamCore<number> {
  type: RecipeParamType.Number | RecipeParamType.Integer;
  minimum?: number;
  maximum?: number;
}

export type RecipeObjectSchemas = JSONSchema6;

export interface RecipeObjectParam extends RecipeParamCore {
  type: RecipeParamType.Object;
  objectSchema: RecipeObjectSchemas;
  additionalProperties?: boolean;
}

export interface RecipeArrayParam extends RecipeParamCore {
  type: RecipeParamType.Array;
  arraySchema: RecipeParam;
  minItems?: number;
  maxItems?: number;
}

export function isVariedParam(type: RecipeParamType): type is RecipeParamType {
  return (
    type === RecipeParamType.AnyOf ||
    type === RecipeParamType.AllOf ||
    type === RecipeParamType.OneOf
  );
}

export interface RecipeVariedParam extends RecipeParamCore {
  type: RecipeParamType.AnyOf | RecipeParamType.AllOf | RecipeParamType.OneOf;
  variants: RecipeParam[];
}

export interface RecipeFileParam extends RecipeParamCore {
  type: RecipeParamType.File;
  format: "binary" | "byte" | "audio";
}

export type RecipeParam =
  | RecipeStringParam
  | RecipeBooleanParam
  | RecipeNumericalParam
  | RecipeObjectParam
  | RecipeArrayParam
  | RecipeVariedParam
  | RecipeFileParam;

export type RecipeTemplate = Omit<
  UserTemplate,
  | "id"
  | "created_at"
  | "project"
  | "recipe_id"
  | "visibility"
  | "alias"
  | "original_author"
  | "recipe"
>;

interface RecipeTemplateOutput {
  output: JSONBody;
  duration: number;
  streaming?: boolean;
}

export interface UserTemplatePreview {
  alias: string;
  id: string;
  created_at: string;
  title: string;
  description: string;
  original_author: {
    user_id: string;
    username: string;
    avatar: string;
  };

  recipe: Pick<Recipe, "id" | "project" | "title" | "method">;
  visibility: "public" | "private";

  replay: Nullable<RecipeTemplateOutput>;
  author_id: string;
  project_scope: ProjectScope;
}

export type UserTemplate = UserTemplatePreview & {
  author_id: string;
  project: string;
  recipe_id: number;
} & NullableRecipeParams;

export type RecipeBook = {
  project: string;
  title: string;
  description: string;
  version: string;
  server: string;
  recipes: Recipe[];
};

export enum RecipeOutputType {
  Void = "Void",
  Response = "Response",
  Streaming = "Streaming",
  Error = "Error",
}

export type RecipeParameters = {
  requestBody: JSONBody;
  queryParams: JSONBody;
  urlParams: JSONBody;
};

export interface RequestHeader {
  name: string;
  value: string;
  sensitive?: boolean;
}
