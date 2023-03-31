import {MongoClient, Db} from 'mongodb';
import {KnownRecipe} from "./types";
import {transformRecipesNameLower} from "./RecipeService";

const url = `mongodb+srv://${process.env.ACC}:${process.env.PW}@crafteditemsdb.kp6faxe.mongodb.net/craftedItemsDB?retryWrites=true&w=majority`;
const collectionName = 'craftedItems';

let client: MongoClient;
let db: Db;

export interface ICraftingData {
    id: number,
    id_crafted_item: number,
    item_name: string
}
// const
export const initializeDatabase = async () => {
    client = await MongoClient.connect(url);
    db = client.db();
}

const getCollection = () => db.collection<ICraftingData>(collectionName);

export const fetchProfessionsForRecipes = async (knownRecipes: KnownRecipe[]) => {
    const recipeNames = transformRecipesNameLower(knownRecipes);
    const mongoCollection = await getCollection();
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
