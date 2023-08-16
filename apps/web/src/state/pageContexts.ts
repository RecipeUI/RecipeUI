import { RecipeProject } from "types/database";
import { createContext } from "react";

export const RecipeProjectsContext = createContext<RecipeProject[]>([]);
