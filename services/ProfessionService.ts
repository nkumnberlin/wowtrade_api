import rp from 'request-promise';
import {ProfessionSkillTree} from "./types";
import {OAuthClient} from "../oauth/client";
import {getProfessionsCollection} from "./database";

const oauthClient = new OAuthClient();

const BASE_URL = "https://eu.api.blizzard.com";

const professionMap: {professionId: number, skillTierId: number}[] = require('../assets/professionCalls.json');

const PROFESSION_SKILL_TIER_URL = (professionId: number, skillTierId: number) => `${BASE_URL}/data/wow/profession/${professionId}/skill-tier/${skillTierId}?namespace=static-de&locale=de_DE`

const getProfessionSkillTree = async (professionId: number, skillTierId: number) => {
    const authToken = await oauthClient.getToken();
    console.log("authhhh", authToken);
    return (rp.get({
        uri: PROFESSION_SKILL_TIER_URL(professionId, skillTierId),
        json: true,
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    }) as rp.RequestPromise<ProfessionSkillTree>);
}

const saveAllProfessions = async () => {
    const allProfessions = await Promise.all(professionMap.map(({professionId, skillTierId}) => getProfessionSkillTree(professionId, skillTierId)));
    const professionCollection = await getProfessionsCollection();
    return professionCollection.insertMany(allProfessions);
}

