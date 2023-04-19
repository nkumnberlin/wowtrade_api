import { MongoClient, Db } from 'mongodb';
import { Session } from 'fastify';
import {
  getAllProfessionSkillTrees,
  saveAllProfessionsIfNotExist,
} from '../profession/ProfessionService';
import {
  removeAllCraftedItemsWithEmptyId,
  updateCraftedItemsWithRecipeId,
} from '../profession/CraftedItemsService';
import { ProfessionSkillTree, ICraftingData } from '../profession/types';

import { ListingData } from '../order/types';

export const url = `mongodb+srv://${process.env.ACC}:${process.env.PW}@crafteditemsdb.kp6faxe.mongodb.net/craftedItemsDB?retryWrites=true&w=majority`;
const craftedItemsCollectionName = 'craftedItems';
const listingsCollectionName = 'orders';
const listingsProfessionsName = 'professions';

export const getCraftedItemsCollection = async () => {
  const client = await MongoClient.connect(url);
  const db = client.db();
  const craftedItems = await db.collection<ICraftingData>(craftedItemsCollectionName);
  await client.close();
  return craftedItems;
};
export const getListingsCollection = async () => {
  const client = await MongoClient.connect(url);
  const db = client.db();
  const listingData = db.collection<ListingData>(listingsCollectionName);
  await client.close();
  return listingData;
};
export const getProfessionsCollection = async () => {
  const client = await MongoClient.connect(url);
  const db = client.db();
  const skillTree = db.collection<ProfessionSkillTree>(listingsProfessionsName);
  await client.close();
  return skillTree;
};
export const initializeDatabase = async () => {
  const listingsCollection = await getListingsCollection();
  await listingsCollection.createIndex({ expiredAt: 1 }, { expireAfterSeconds: 0 });
  await saveAllProfessionsIfNotExist();
  const allProfessionSkillTrees = await getAllProfessionSkillTrees();
  await updateCraftedItemsWithRecipeId(allProfessionSkillTrees);
  await removeAllCraftedItemsWithEmptyId();
};
