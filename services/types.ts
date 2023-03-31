import exp from "constants";

export interface IGetCharacter {
  characterName: string;
  realmName: string;
}
export type REGIONS = "eu" | "us";

export interface DragonFlightProfessions {
  profession: Profession;
  tiers: Tiers[];
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
}

export interface KnownRecipeWithItemId extends KnownRecipe {
  itemId: number;
}
