import { Database } from "@/types/database.types";

export enum RecipeProjectStatus {
  Active = "Active",
  ToInstall = "Install",
  Waitlist = "Waitlist",
  Soon = "Soon",
}

export type RecipeProject = Omit<
  Database["public"]["Tables"]["project"]["Row"],
  "status"
> & {
  status: RecipeProjectStatus;
};

export enum RecipeParamType {
  String = "string",
  Boolean = "boolean",
  Number = "number",
  Integer = "integer",
  Object = "object",
  Array = "array",
  AnyOf = "anyOf",
  AllOf = "allOf",
  OneOf = "oneOf",
  File = "file",
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

export enum RecipeMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export enum RecipeAuthType {
  Bearer = "bearer",
  ClientID = "clientId",
  Token = "token",
  Custom = "custom",
}

export type RecipeCore = Omit<
  Database["public"]["Tables"]["recipe"]["Row"],
  | "auth"
  | "method"
  | "queryParams"
  | "urlParams"
  | "templates"
  | "requestBody"
  | "options"
> & {
  label: string;
  method: RecipeMethod;
  auth: string | null;
  queryParams?: RecipeObjectSchemas;
  urlParams?: RecipeObjectSchemas;
  templates?: RecipeTemplate[];
  options: null | {
    cors: boolean;
    deprecated: boolean;
    streaming: boolean;
    auth: string[];
  };

  // Added on later
  userTemplates?: UserTemplatePreview[];
};

export enum RecipeMutationContentType {
  JSON = "application/json",
  FormData = "multipart/form-data",
}

export type RecipeTemplate = Omit<
  UserTemplate,
  "id" | "created_at" | "project" | "recipe_id" | "visibility"
>;

interface RecipeTemplateOutput {
  output: Record<string, unknown>;
  duration: number;
  streaming?: boolean;
}

export interface UserTemplatePreview {
  alias: string;
  id: number;
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

  replay?: RecipeTemplateOutput | null;
}

export type UserTemplate = UserTemplatePreview & {
  author_id: string;
  project: string;
  recipe_id: number;

  requestBody?: Record<string, unknown>;
  queryParams?: Record<string, unknown>;
  urlParams?: Record<string, unknown>;
};
export interface RecipeMutationCore extends RecipeCore {
  method: RecipeMethod.POST | RecipeMethod.PUT | RecipeMethod.DELETE;
  requestBody: RecipeObjectParam & {
    contentType: RecipeMutationContentType;
  };
}

export type Recipe = RecipeCore | RecipeMutationCore;

export type RecipeBook = {
  project: string;
  title: string;
  description: string;
  version: string;
  server: string;
  recipes: Recipe[];
};

export type User = Database["public"]["Tables"]["user"]["Row"];
