const rp = require('request-promise');
const slug = require('slug');
const {
    NAMESPACE_PROFILE_US,
    DEFAULT_LOCALE
} = require('../constants');

class CharacterService {

    constructor(oauthClient) {
        this.oauthClient = oauthClient;
    }

    async getCharacter(characterName, realmName) {
        const oauthToken = await this.oauthClient.getToken();
        const encodedCharacterName = encodeURIComponent(characterName);
        const realmNameSlug = slug(realmName);
        const characterSummaryDocumentURL = `https://eu.api.blizzard.com/profile/wow/character/${realmNameSlug}/${encodedCharacterName}`;
        const response = await rp.get({
            uri: characterSummaryDocumentURL,
            json: true,
            qs: {
                locale: DEFAULT_LOCALE,
                namespace: NAMESPACE_PROFILE_US
            },
            headers: {
                Authorization: `Bearer ${oauthToken}`
            }
        });
        console.log('response', response)
        return response;
    }

    async getCharacterMedia(character) {
        const oauthToken = await this.oauthClient.getToken();
        const characterMediaDocumentURL = character.media.href;
        const response = await rp.get({
            uri: characterMediaDocumentURL,
            json: true,
            headers: {
                Authorization: `Bearer ${oauthToken}`
            }
        });
        return response;
    }

    async getUsersCharactersList(usersAccessToken) {
        console.log('RETCH', usersAccessToken)
        const response = await rp.get({
            uri: `https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu`,
            json: true,
            headers: {
                Authorization: `Bearer ${usersAccessToken}`
            }
        });
        const { wow_accounts } = response;
        return wow_accounts
            .map((account) => this._mapWowAccount(account))
            .flat()
            .filter((character)=> character.level > 60)
    }
    async getUserProfessionsToCharacter(usersAccessToken, characterName, realmSlug){
        const response = await rp.get({
            uri: `https://eu.api.blizzard.com/profile/wow/character/${realmSlug}/${characterName}/professions`,
            json: true,
            headers: {
                Authorization: `Bearer ${usersAccessToken}`
            }
        });
        console.log(response)
        return {message: 'nix'}
        // const { wow_accounts } = response;
        // // console.log('characterlist1 ', characters)
        // return wow_accounts
        //     .map((account) => this._mapWowAccount(account))
        //     .flat()
        //     .sort((characterA, characterB) => {
        //         return (characterA.level < characterB.level) ? 1 : -1;
        //     });
    }

    _mapWowAccount(account) {
        const { characters } = account;
        return characters.map((character) => this._mapCharacter(account, character));
    }

    _mapCharacter(account, character) {
        character.account_id = account.id;
        const characterName = character.name.toLowerCase();
        const realmSlug = character.realm.slug;
        character.armoryUrl = `https://worldofwarcraft.com/character/us/${realmSlug}/${characterName}`;
        return character;
    }
}

module.exports = CharacterService;
