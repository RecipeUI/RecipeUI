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
}

export enum RecipeMutationContentType {
  JSON = "application/json",
  FormData = "multipart/form-data",
}
