import { RecipeProject } from "@/types/databaseExtended";
import { createContext } from "react";

export const RecipeProjectsContext = createContext<RecipeProject[]>([]);
