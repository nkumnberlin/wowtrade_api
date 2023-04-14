import { MongoClient, Db } from 'mongodb';
import {Session} from 'fastify';
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
import {MongoSession} from "../authentication/session/types";

export const url = `mongodb+srv://${process.env.ACC}:${process.env.PW}@crafteditemsdb.kp6faxe.mongodb.net/craftedItemsDB?retryWrites=true&w=majority`;
const craftedItemsCollectionName = 'craftedItems';
const listingsCollectionName = 'orders';
const listingsProfessionsName = 'professions';
const sessionCollectionName = 'sessions';

let client: MongoClient;
let db: Db;
// const

export const getCraftedItemsCollection = () =>
  db.collection<ICraftingData>(craftedItemsCollectionName);
export const getListingsCollection = () => db.collection<ListingData>(listingsCollectionName);
export const getProfessionsCollection = () =>
  db.collection<ProfessionSkillTree>(listingsProfessionsName);
export const getSessionsCollection = () =>
  db.collection<MongoSession>(sessionCollectionName);
export const initializeDatabase = async () => {
  client = await MongoClient.connect(url);
  db = client.db();
  const listingsCollection = getListingsCollection();
  await listingsCollection.createIndex({ expiredAt: 1 }, { expireAfterSeconds: 0 });
  await saveAllProfessionsIfNotExist();
  const allProfessionSkillTrees = await getAllProfessionSkillTrees();
  await updateCraftedItemsWithRecipeId(allProfessionSkillTrees);
  await removeAllCraftedItemsWithEmptyId();
};
