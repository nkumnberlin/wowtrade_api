const rp = require("request-promise");

class CharacterService {
  async getUsersCharactersList(usersAccessToken: string) {
    console.log("RETCH", usersAccessToken);
    const response = await rp.get({
      uri: `https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu`,
      json: true,
      headers: {
        Authorization: `Bearer ${usersAccessToken}`,
      },
    });
    const { wow_accounts } = response;
    console.log("TODO TO MAP", wow_accounts);
    // todo
    return wow_accounts
      .map((account: any) => this._mapWowAccount(account))
      .flat()
      .filter((character: { level: number }) => character.level > 60);
  }
  async getUserProfessionsToCharacter(
    usersAccessToken: string,
    characterName: string,
    realmSlug: string
  ) {
    const encodedCharacterName = encodeURIComponent(characterName);
    const response = await rp.get({
      uri: `https://eu.api.blizzard.com/profile/wow/character/${realmSlug}/${encodedCharacterName}/professions`,
      json: true,
      headers: {
        Authorization: `Bearer ${usersAccessToken}`,
      },
    });
    console.log("USER PROFESSIONS", response);
    const { primaries, character } = response;

    return { primaries, character };
  }
  // todo
  _mapWowAccount(account: any) {
    const { characters } = account;
    return characters.map((character: any) =>
      this._mapCharacter(account, character)
    );
  }
  // todo

  _mapCharacter(account: any, character: any) {
    character.account_id = account.id;
    const characterName = character.name.toLowerCase();
    const realmSlug = character.realm.slug;
    character.armoryUrl = `https://worldofwarcraft.com/character/us/${realmSlug}/${characterName}`;
    return character;
  }
}

module.exports = CharacterService;
