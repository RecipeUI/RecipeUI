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
  PATCH = "PATCH",
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
  Custom = "custom",
  Multiple = "Multiple",
  Query = "query",
  OAuth2 = "oauth2",
  Header = "header",
  Basic = "basic",
}

export enum RecipeMutationContentType {
  JSON = "application/json",
  FormData = "multipart/form-data",
}

export const ContentTypeLabel = {
  [RecipeMutationContentType.JSON]: "JSON",
  [RecipeMutationContentType.FormData]: "Form",
};

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
  PersonalCollections = "PersonalCollections",
}

export enum RecipeError {
  AbortedRequest = "AbortedRequest",
}

export enum ContentType {
  JSON = "application/json",
  FormData = "multipart/form-data",
  Text = "text/plain",
  HTML = "text/html",
  XML = "application/xml",
  PDF = "application/pdf",
}

export enum OAuth2Grant {
  ClientCredentials = "client_credentials",
  AuthorizationCode = "authorization_code",
  Password = "password",
}
