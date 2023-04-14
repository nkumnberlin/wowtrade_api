import { Authenticator } from '@fastify/passport';
import strategies, { StrategyOptions } from 'passport-bnet';
import { env } from '../utils/env';

const BnetStrategy = strategies.Strategy;

const passportCallback = (accessToken: string, refreshToken: string, profile: any, done: any) => {
  process.nextTick(() => {
    console.log('felix fuer unsere augen, pipikaka ', accessToken, refreshToken, profile);
    return done(null, profile);
  });
};

const passportOptions: StrategyOptions = {
  clientID: env.OAUTH_CLIENT_ID,
  clientSecret: env.OAUTH_CLIENT_SECRET,
  callbackURL: env.OAUTH_CALLBACK_URL,
  scope: 'wow.profile',
};

export interface BnetUser {
  id: string;
  token: string;
}

const authenticator = new Authenticator();
authenticator.registerUserSerializer(async (user: BnetUser, request) => user);

authenticator.registerUserDeserializer(async (user: BnetUser, request) => user);

authenticator.use(new BnetStrategy(passportOptions, passportCallback));

export { authenticator };
