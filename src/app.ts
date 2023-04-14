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
import { authenticationController } from './authentication/controller/authenticationController';
import {characterController} from "./character/controller/characterController";
import {professionController} from "./profession/controller/professionController";
import {orderController} from "./order/controller/orderController";

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

const app = fastify();
const store = MongoStore.create({
  mongoUrl: url,
});

app.register(fastifyCookie, {
  secret: 'qrtezfzuhvg frhwhbs8fg8zuvwbcwuzfveuigf87wigfuiwb78wgiubciksdbkvbsdk',
});

app.register(session, {
  cookieName: 'wow-trade-session',
  secret: 'wow-trade-secret-wow-trade-secret-wow-trade-secret-wow-trade-secret-wow-trade-secret-',
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

app.register(authenticationController);
app.register(characterController);
app.register(professionController);
app.register(orderController);

const port = env.PORT;

initializeDatabase().then(() =>
  app.listen({ port, host: '::' }, (err) => {
    if(err){
      console.error(err)
    }
    console.log(`Worker  listening on port ${port}`);
  })
);
