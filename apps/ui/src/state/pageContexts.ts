import { RecipeProject } from "types";
import { createContext } from "react";

export const RecipeProjectsContext = createContext<RecipeProject[]>([]);
