import { CollectionModule, modules } from ".";
import { RecipeOptions } from "../database";

export function isCollectionModule(
  value?: string | null
): value is CollectionModule {
  if (value == undefined) return false;

  return modules.includes(value as CollectionModule);
}

export function getCollectionModule({
  project,
  options,
}: {
  project?: string | null;
  options?: RecipeOptions | null;
}) {
  if (isCollectionModule(project)) {
    return project;
  } else if (options?.module && isCollectionModule(options.module)) {
    return options.module;
  }
}
