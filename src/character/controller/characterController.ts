import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import {CharacterQueryRequest} from "../types";
import CharacterService from "../CharacterService";
const characterService = new CharacterService();

export const characterController: FastifyPluginCallback = (app, opts, done) => {
  app.get('/authenticated/characters', async (req: FastifyRequest, res) => {
    if(!req?.user?.token){
      return res.status(500).send({ message: 'Failed while fetching Characters' });
    }
    try {
      const characters = await characterService.getUsersCharactersList(req?.user?.token);
      return await res.status(200).send(characters);
    } catch (e) {
      return res.status(500).send({ message: 'Failed while fetching Characters' });
    }
  });
/// authenticated/character/professions?name=Cdb&slug=Thrall&region=eu
  app.get('/authenticated/character/professions', async (req: CharacterQueryRequest, res) => {
    if(!req?.user?.token){
      return res.status(500).send({ message: 'Failed while fetching Characters' });
    }
    try {
      console.log('is in professions');
      const { name, slug } = req.query;
      const professions = await characterService.getUserProfessionsToCharacter(
          req?.user?.token,
          name,
          slug
      );
      return await res.send(professions);
    } catch (e) {
      return res.status(500).send({ message: 'Failed while fetching Characters' });
    }
  });
  done();
};
