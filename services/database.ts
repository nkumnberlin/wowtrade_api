import {MongoClient, Db} from 'mongodb';
import {ICraftingData, KnownRecipe, ListingData, ProfessionSkillTree} from "./types";
import {transformRecipesNameLower} from "./RecipeService";

const url = `mongodb+srv://${process.env.ACC}:${process.env.PW}@crafteditemsdb.kp6faxe.mongodb.net/craftedItemsDB?retryWrites=true&w=majority`;
const craftedItemsCollectionName = 'craftedItems';
const listingsCollectionName = 'orders';
const listingsProfessionsName = 'professions';

let client: MongoClient;
let db: Db;
// const

export const getCraftedItemsCollection = () => db.collection<ICraftingData>(craftedItemsCollectionName);
export const getListingsCollection = () => db.collection<ListingData>(listingsCollectionName);
export const getProfessionsCollection = () => db.collection<ProfessionSkillTree>(listingsProfessionsName);
export const initializeDatabase = async () => {
    client = await MongoClient.connect(url);
    db = client.db();
    const listingsCollection = await getListingsCollection();
    await listingsCollection.createIndex({ expiredAt: 1 }, { expireAfterSeconds: 0 })
    // persist professions
    // update all craftedItems matched by name-lower-case-with-dashes with id_recipe by id
    // rem crafted id null | undefined
}


