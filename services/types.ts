import exp from "constants";
import { ObjectId } from "mongodb";

export interface IGetCharacter {
  characterName: string;
  realmName: string;
}
export type REGIONS = "eu" | "us";

export interface DragonFlightProfessions {
  profession: Profession;
  tiers: Tiers;
}

export interface IProfession {
  profession: Profession;
  tiers: Tiers[];
}

export interface Profession {
  key: Key;
  name: string;
  id: number;
}

export interface Key {
  href: string;
}

export interface Tiers {
  skill_points: number;
  max_skill_points: number;
  tier: Tier;
  known_recipes: KnownRecipe[] | KnownRecipeWithItemId[];
}

export interface Tier {
  name: string;
  id: number;
}

export interface KnownRecipe {
  key: Key;
  name: string;
  id: number;
  id_crafted_item?: number;
}

export interface KnownRecipeWithItemId extends KnownRecipe {
  itemId: number;
}

export interface ICraftingData {
  id: number;
  id_crafted_item: number;
  item_name: string;
<<<<<<< HEAD
  id_recipe: number;
=======
>>>>>>> e1d7f62 (update types)
}

const DAY_IN_SECONDS = 86_400;
export enum ListingDuration {
  SIX_HOURS = DAY_IN_SECONDS / 4,
  TWELVE_HOURS = DAY_IN_SECONDS / 2,
  ONE_DAY = DAY_IN_SECONDS,
  THREE_DAYS = DAY_IN_SECONDS * 3,
  SEVEN_DAYS = DAY_IN_SECONDS * 7,
}
export interface ListingData {
  _id?: ObjectId;
  difficulty: number;
  quality: string;
  qualifiedCharacterName: string;
  creatorAccountId?: number;
  profession: string;
  currentSkill: number;
  commission: {
    silver: number;
    gold: number;
  };
  listingDuration: ListingDuration;
  expiredAt?: Date;
  createdAt?: Date;
  item: Omit<ICraftingData, "id">;
  qualityProcChance: number;
  multicraftPercentage: number;
}
export interface ExpectingListingData {
  difficulty: string;
  quality: string;
  creatorAccountId?: number;
  qualifiedCharacterName: string;
  profession: string;
  currentSkill: string;
  commission: {
    silver: string;
    gold: string;
  };
  listingDuration: string;
  item: { id_crafted_item: string; item_name: string };
  qualityProcChance: string;
  multicraftPercentage: string;
}

export interface ProfessionSkillTree {
  _links: Links;
  id: number;
  name: string;
  minimum_skill_level: number;
  maximum_skill_level: number;
  categories: Category[];
}

export interface Links {
  self: Link;
}

export interface Link {
  href: string;
}

export interface Category {
  name: string;
  recipes: KnownRecipe[];
}

export interface FrontendListingData
  extends Omit<ListingData, "creatorAccountId"> {}
