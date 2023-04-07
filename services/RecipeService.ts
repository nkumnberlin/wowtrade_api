import {KnownRecipe} from "./types";
import {fetchProfessionsByRecipeNames} from "./CraftedItemsService";


export const transformRecipeNameLower = (knownRecipe: KnownRecipe) => knownRecipe.name.toLowerCase().replaceAll(" ", "-")
export const transformRecipesNameLower = (knownRecipes: KnownRecipe[]) => knownRecipes.map(transformRecipeNameLower)

export const fetchProfessionsForRecipes = async (knownRecipes: KnownRecipe[]) => {
    const recipeNames = transformRecipesNameLower(knownRecipes);
    return await fetchProfessionsByRecipeNames(recipeNames);
}
