import fastify, { FastifyReply, FastifyRequest } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import session from '@fastify/session';
import MongoStore from 'connect-mongo';
import fastifyCors from '@fastify/cors';
import { ExpectingListingData } from './order/types';
import { createOrderMapper } from './helper/order/createOrderMapper';
import {
  findLastFiveCreatedListings,
  findByCreatorAccountId,
  saveListing,
  deleteListingOfUser,
  findByItemID,
} from './order/ListingService';
import { authenticator, BnetUser } from './oauth/bnetPassport';

import { initializeDatabase, url } from './services/database';
import SessionStore = session.SessionStore;
import { env } from './utils/env';

require('dotenv').config();
const { getAllProfessionSkillTrees } = require('./profession/ProfessionService');
const CharacterService = require('./character/CharacterService');
const OauthClient = require('./oauth/client');

declare module 'fastify' {
  export interface FastifyRequest {
    isAuthenticated: () => boolean;
  }

  export interface FastifyReply {
    user?: PassportUser;
  }

  interface PassportUser extends BnetUser {}
}

type CharacterQueryRequest = FastifyRequest<{
  Querystring: {
    code: string;
    name: string;
    slug: string;
    region: string;
  };
}>;
type OrderFetchRequest = FastifyRequest<{
  Querystring: {
    itemName?: string;
    id_crafted_item?: string;
    accountId?: string;
  };
}>;

const oauthClient = new OauthClient();
const characterService = new CharacterService(oauthClient);

const app = fastify();
const store = MongoStore.create({
  mongoUrl: url,
});

app.register(fastifyCookie, {
  secret: 'qrtezfzuhvg frhwhbs8fg8zuvwbcwuzfveuigf87wigfuiwb78wgiubciksdbkvbsdk',
});

app.register(session, {
  cookieName: 'wow-trade-session',
  secret: 'wow-trade-secret',
  saveUninitialized: true,
  store: store as unknown as SessionStore,
});

app.register(authenticator.initialize());

app.register(authenticator.secureSession());

app.register(fastifyCors);

app.addHook('onRequest', (req: FastifyRequest, res, next) => {
  if (!req.url.includes('authenticated')) {
    return next();
  }
  if (req.isAuthenticated()) {
    console.log('is authenticated', req.user);
    res.user = req.user;
    return next();
  }
  console.log('next step, nicht eingeloggt');
  res.redirect('/');
  return next();
});

app.get('/login', (req, res) => {
  res.redirect('/login/oauth/battlenet');
});

app.get('/logout', (req, res) => {
  console.log('session id ', req.session.sessionId);
  // @ts-ignore
  req.session.destroy();
  return res.send({
    status: 201,
    message: 'Logged out',
  });
});

app.get('/login/oauth/battlenet', authenticator.authenticate('bnet'));

app.get(
  '/redirect',
  { preValidation: authenticator.authenticate('bnet', { failureRedirect: '/' }) },
  (req, res) => {
    const redirectURL: URL = new URL(`${req.headers.referer}/callback`);
    res.status(301).redirect(redirectURL.href);
  }
);

app.get('/professions', async (req: FastifyRequest, res) => {
  try {
    const allProfessions = await getAllProfessionSkillTrees();
    return await res.status(200).send({
      status: 200,
      data: allProfessions,
    });
  } catch (e) {
    console.log('error while in professions', e);
    return res.status(500).send({
      status: 500,
      message: 'Error while fetching Professions',
    });
  }
});

app.get('/authenticated/characters', async (req: FastifyRequest, res) => {
  try {
    const characters = await characterService.getUsersCharactersList(req?.user?.token);
    return await res.status(200).send(characters);
  } catch (e) {
    return res.status(500).send({ message: 'Failed while fetching Characters' });
  }
});
/// authenticated/character/professions?name=Cdb&slug=Thrall&region=eu
app.get('/authenticated/character/professions', async (req: CharacterQueryRequest, res) => {
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

app.post(
  '/authenticated/order',
  async (
    req: FastifyRequest<{
      Body: ExpectingListingData;
    }>,
    res
  ) => {
    if (!req?.user?.id) {
      return res.status(500).send({
        status: 500,
        message: `UserId doesn't exist.`,
      });
    }
    try {
      const listingData = req.body;
      listingData.creatorAccountId = parseInt(req?.user?.id, 10);
      const orderDTO = createOrderMapper(listingData);
      console.log('0der', orderDTO);
      const createdOrder = await saveListing(orderDTO);
      return await res.send(createdOrder).status(201);
    } catch (e) {
      console.log('error while created', e);
      return res.status(500).send({
        status: 500,
        message: `Failed while creating order. ${e}`,
      });
    }
  }
);

app.delete('/authenticated/order', async (req: OrderFetchRequest, res) => {
  const { id_crafted_item: IdCraftedItem } = req.query;
  const creatorAccountId = req?.user?.id;
  if (!IdCraftedItem) {
    return res.status(500).send({
      status: 500,
      message: 'id does not exist',
    });
  }
  if (!creatorAccountId) {
    return res.status(500).send({
      status: 500,
      message: `UserId doesn't exist.`,
    });
  }
  const itemId = parseInt(IdCraftedItem, 10);
  console.log('in delete, ', IdCraftedItem);
  try {
    await deleteListingOfUser(itemId, parseInt(creatorAccountId, 10));
    return await res.status(201).send({
      status: 201,
      message: 'successfully deleted',
    });
  } catch (e) {
    return res.status(500).send({
      status: 500,
      message: `Failed while deleting order. ${e}`,
    });
  }
});
app.get('/viewLast5', async (req: FastifyRequest, res) => {
  console.log('ist in order');
  const lastFiveOrders = await findLastFiveCreatedListings();
  return res.send(lastFiveOrders).status(200);
});
app.get('/order', async (req: OrderFetchRequest, res) => {
  const { id_crafted_item: IdCraftedItem } = req.query;
  if (!IdCraftedItem) return res.send(500).send({ status: 500 });
  console.log('id: ', IdCraftedItem);
  const craftedItemId = parseInt(IdCraftedItem, 10);
  const allItems = await findByItemID(craftedItemId);
  console.log('aall items', allItems);
  return res
    .send({
      data: allItems,
      status: 200,
    })
    .status(200);
});

app.get('/authenticated/order', async (req: OrderFetchRequest, res) => {
  try {
    const accountId = req?.user?.id;
    console.log('req user', req.user);
    if (accountId) {
      const ordersByAccountCreatorId = await findByCreatorAccountId(parseInt(accountId, 10));
      return await res.send(ordersByAccountCreatorId).status(200);
    }
    return await res.status(500).send({ message: 'Failed while fetching Characters' });
  } catch (e) {
    return res.status(500).send({ message: 'Failed while fetching Characters' });
  }
});

app.get('/', (req: FastifyRequest, res: FastifyReply) => {
  console.log('nice cookies!', req.cookies);
  if (req.isAuthenticated()) {
    return res.redirect('/authenticated');
  }
  console.log('ist nicht authentifizifert > redirect to /login-');
  const redirectURL: URL = new URL('/ungracefully-logout');
  return res.status(301).redirect(redirectURL.href);
});
const port = env.PORT;

initializeDatabase().then(() =>
  app.listen({ port, host: '::' }, () => console.log(`Worker  listening on port ${port}`))
);
