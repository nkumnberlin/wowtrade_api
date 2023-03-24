import { DeserializeUserFunction, DoneCallback, Profile } from "passport";
import { IUser } from "./types";

const passport = require("passport");
const BnetStrategy = require("passport-bnet").Strategy;

const passportOptions = {
  clientID: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  callbackURL: process.env.OAUTH_CALLBACK_URL,
  scope: "wow.profile",
};

const passportCallback = (
  accessToken: string,
  refreshToken: string,
  profile: Profile,
  done: DoneCallback
) => {
  process.nextTick(() => {
    console.log(
      "felix fuer unsere augen, pipikaka ",
      accessToken,
      refreshToken,
      profile,
      done
    );
    return done(null, profile);
  });
};

passport.serializeUser(function (user: IUser, done: DoneCallback) {
  done(null, user);
});

passport.deserializeUser(function (user: IUser, done: DoneCallback) {
  done(null, user);
});

passport.use(new BnetStrategy(passportOptions, passportCallback));

module.exports = passport;
