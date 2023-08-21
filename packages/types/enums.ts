export enum RecipeProjectStatus {
  Active = "Active",
  ToInstall = "Install",
  Waitlist = "Waitlist",
  Soon = "Soon",
}

export enum RecipeMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

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

export enum RecipeAuthType {
  Bearer = "bearer",
  ClientID = "clientId",
  Token = "token",
  Custom = "custom",
  Query = "query",
  OAuth = "oauth",
  Setup = "setup",
  Header = "header",
  HeaderWithPrefix = "headerWithPrefix",
}

export enum RecipeMutationContentType {
  JSON = "application/json",
  FormData = "multipart/form-data",
}

export enum AuthFormType {
  None,
  Bearer,
  OAuth,
  QueryParam,
  MultipleParams,
}

export enum ProjectVisibility {
  Public = "public",
  Private = "private",
  Unlisted = "unlisted",
}

export enum Visibility {
  Public = "public",
  Private = "private",
  Unlisted = "unlisted",
}

export enum ProjectMemberRole {
  Owner = "owner",
  Editor = "editor",
  Viewer = "viewer",
}

export enum ProjectScope {
  Personal = "personal",
  Team = "team",
  Global = "global",
}

export enum QueryKey {
  Recipes = "Recipes",
  RecipesView = "RecipesView",
  RecipesHomeView = "RecipesHomeView",
  Projects = "Projects",
}

export enum RecipeError {
  AbortedRequest = "AbortedRequest",
}
