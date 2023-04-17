import fastify, { FastifyRequest } from 'fastify';

import fastifyCookie from '@fastify/cookie';
import session from '@fastify/session';
import fastifyCors from '@fastify/cors';
import { authenticator, BnetUser } from './oauth/bnetPassport';
import { initializeDatabase, url } from './services/database';
import { env } from './utils/env';
import { authenticationController } from './authentication/controller/authenticationController';
import { characterController } from './character/controller/characterController';
import { professionController } from './profession/controller/professionController';
import { orderController } from './order/controller/orderController';
import MongoStore from 'connect-mongo';
import SessionStore = session.SessionStore;

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
const store = new MongoStore({ mongoUrl: url });

app.register(fastifyCookie);

app.register(session, {
  cookieName: 'wow-trade-session',
  secret: 'wow-trade-secret-wow-trade-secret-wow-trade-secret-wow-trade-secret-wow-trade-secret-',
  store: store as unknown as SessionStore,
  saveUninitialized: true,
  cookie: {
    // THIS IS FUCKING IMPORTANT NEVER DELETE THIS !!!
    secure: 'auto',
  },
});

app.register(authenticator.initialize());

app.register(authenticator.secureSession());

app.register(fastifyCors);

app.addHook('preValidation', (req: FastifyRequest, res, next) => {
  if (!req.url.includes('authenticated')) {
    return next();
  }
  if (req.isAuthenticated()) {
    console.log('is authenticated', req.user);
    res.user = req.user;
    return next();
  }
  console.log('next step, nicht eingeloggt', req.user);
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
    if (err) {
      console.error(err);
    }
    console.log(`Worker  listening on port ${port}`);
  })
);
