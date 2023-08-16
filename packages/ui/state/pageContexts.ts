import { createContext } from "react";
import { RecipeProject } from "types/database";

export const RecipeProjectsContext = createContext<RecipeProject[]>([]);
