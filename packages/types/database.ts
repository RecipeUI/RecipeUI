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
            requestBody: Nullable<RecipeRequestBody>;
            queryParams: Nullable<RecipeObjectSchemas>;
            urlParams: Nullable<RecipeObjectSchemas>;
          };
          Insert: {
            templates: Nullable<RecipeTemplate[]>;
            options: Nullable<RecipeOptions>;
            method: RecipeMethod;
            requestBody: Nullable<RecipeRequestBody>;
            queryParams: Nullable<RecipeObjectSchemas>;
            urlParams: Nullable<RecipeObjectSchemas>;
          };
        };
        template: {
          Row: {
            replay: Nullable<RecipeTemplateOutput>;
            project_scope: ProjectScope;
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

export type User = Tables<"user">;
export type RecipeProject = Tables<"project">;
export type Recipe = Tables<"recipe"> & {
  userTemplates?: UserTemplatePreview[];
};

export interface AuthConfig {
  type: RecipeAuthType;
  payload: {
    name: string;
    prefix?: string;
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

export type RecipeObjectSchemas = (RecipeParam & { name: string })[];

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
  "id" | "created_at" | "project" | "recipe_id" | "visibility"
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

  replay?: Nullable<RecipeTemplateOutput>;
  author_id: string;
  project_scope: ProjectScope;
}

export type UserTemplate = UserTemplatePreview & {
  author_id: string;
  project: string;
  recipe_id: number;

  requestBody?: JSONBody;
  queryParams?: JSONBody;
  urlParams?: JSONBody;
};

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
