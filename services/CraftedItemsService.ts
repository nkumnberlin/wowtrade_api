import {getCraftedItemsCollection} from "./database";
import {ProfessionSkillTree} from "./types";
import {transformRecipeNameLower} from "./RecipeService";

export const fetchProfessionsByRecipeNames = async (recipeNames: string[]) => {
    const mongoCollection = await getCraftedItemsCollection();
    const result = await mongoCollection.find({
        item_name: {
            "$in": recipeNames,
        }
    }, {
        projection: {
            id: 1,
            id_crafted_item: 1,
            item_name: 1,
        }
    }).toArray();
    return result;
}

const updateCraftedItemsWithRecipeId = async (professionSkillTrees: ProfessionSkillTree[]) => {
    const craftedItemCollection = await getCraftedItemsCollection();
    professionSkillTrees.map((professionSkillTree) => {
        return professionSkillTree.categories.map((category) => {
            return category.recipes.map((recipe) => ({
                ...recipe,
                name: transformRecipeNameLower(recipe),
            }))
        })
    })
}
