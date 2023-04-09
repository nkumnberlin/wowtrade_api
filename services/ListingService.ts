import { getListingsCollection } from "./database";
import { ListingData } from "./types";

const MILLISECONDS_MULTiPLIER = 1000;
export const saveListing = async (listing: ListingData) => {
  const collection = await getListingsCollection();
  const hasEntries = await collection
    .find({
      creatorAccountId: listing.creatorAccountId,
      "item.id_crafted_item": listing.item.id_crafted_item,
    })
    .toArray();
  if (hasEntries.length)
    throw new Error("item to this user exist and cannot be inserted");
  const expiredAtDate = new Date();
  expiredAtDate.setTime(
    expiredAtDate.getTime() +
      listing.listingDuration.valueOf() * MILLISECONDS_MULTiPLIER
  );
  listing.expiredAt = expiredAtDate;
  listing.createdAt = new Date();

  return await collection.insertOne(listing);
};
export const findbyItemName = async (itemName: string) => {
  const collection = await getListingsCollection();
  return collection
    .find(
      {
        item: {
          item_name: itemName,
        },
      },
      {
        projection: {
          creatorAccountId: 0,
        },
      }
    )
    .toArray();
};

export const findbyCreatorAccountId = async (accountId: number) => {
  const collection = await getListingsCollection();
  return collection.find(
    { creatorAccountId: accountId },
    {
      projection: {
        creatorAccountId: 0,
      },
    }
  );
};

export const findLastFiveCreatedListings = async () => {
  const collection = await getListingsCollection();
  return await collection
    .find(
      {},
      {
        projection: {
          creatorAccountId: 0,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
};
