import {KnownRecipe} from "./types";


export const transformRecipeNameLower = (knownRecipe: KnownRecipe) => knownRecipe.name.toLowerCase().replaceAll(" ", "-")
export const transformRecipesNameLower = (knownRecipes: KnownRecipe[]) => knownRecipes.map(transformRecipeNameLower)
