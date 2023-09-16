export enum CollectionModule {
  NASA = "NASA",
}

const modules = Object.values(CollectionModule);

export function isCollectionModule(value: string): value is CollectionModule {
  return modules.includes(value as CollectionModule);
}
