// TODO: Remove this later
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

export interface RecipeObjectParam extends RecipeParamCore {
  type: RecipeParamType.Object;
  objectSchema: Record<string, RecipeParam>;
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
  format: "binary" | "byte";
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
}

interface RecipeCore {
  title: string;
  summary?: string;
  method: RecipeMethod;
  path: string;
  project: string;
  auth: RecipeAuthType.Bearer | string | null;
  cors?: boolean;
  id: string;
  tags?: string[];
  deprecated?: boolean;
  queryParams?: Record<string, RecipeParam>;
  urlParams?: Record<string, RecipeParam>;
}

export enum RecipeMutationContentType {
  JSON = "application/json",
  FormData = "multipart/form-data",
}
export interface RecipeExample {
  title: string;
  description?: string;
  author: string;
  requestBody?: Record<string, unknown>;
}
export interface RecipeMutationCore extends RecipeCore {
  method: RecipeMethod.POST | RecipeMethod.PUT | RecipeMethod.DELETE;
  requestBody: RecipeParam & {
    contentType: RecipeMutationContentType;
  };
  examples?: RecipeExample[];
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
