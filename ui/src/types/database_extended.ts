import { Database } from "@/types/database.types";

export enum RecipeProjectStatus {
  Active = "View",
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
