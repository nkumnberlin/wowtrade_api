import { NextFunction, Request, Response } from "express";
require("dotenv").config();
const BlueBirdPromise = require("bluebird");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const redis = require("redis");
const morgan = require("morgan");
const authenticatedGuard = require("./middleware/authenticated-guard");
const passport = require("./oauth/passport");
const OauthClient = require("./oauth/client");
const CharacterService = require("./services/CharacterService");
const createLogger = require("pino");

const url = require("url");
const logger = createLogger();
const cors = require("cors");

interface SessionRequest extends Request {
  isAuthenticated: () => boolean;
  user: any;
  query: {
    code: string;
    name: string;
    slug: string;
    region: string;
  };
}

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient(process.env.REDIS_URL);
} else {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  });
}

const redisSessionStore = new RedisStore({
  client: redisClient,
});

const oauthClient = new OauthClient();
const characterService = new CharacterService(oauthClient);

const app = express();

app.use((req: Request, res: Response, next: () => NextFunction) => {
  res.locals = {
    ...res.locals,
    projectName: process.env.PROJECT_NAME || "WoW Trade API",
  };
  next();
});

app.use(cookieParser());

app.use(morgan("combined"));

app.use(
  session({
    name: "wow-trade-session",
    secret: "wow-trade-secret",
    saveUninitialized: true,
    resave: true,
    store: redisSessionStore,
  })
);

app.use(passport.initialize({}));

app.use(passport.session({}));

app.use(cors());

app.use((req: SessionRequest, res: Response, next: () => NextFunction) => {
  if (req.isAuthenticated()) {
    console.log("is authenticated", req.user);
    res.locals.currentUser = req.user;
    return next();
  }
  console.log("next step, nicht eingeloggt");
  next();
});

app.use("/authenticated", authenticatedGuard);

app.get("/login", (req: Request, res: Response) => {
  res.redirect("/login/oauth/battlenet");
});

app.get("/logout", (req: SessionRequest, res: Response) => {
  console.log("landet in session logout", req.session, req.user);
  req.session.destroy((e) => console.log("error while destroying session ", e));
  res.status(301).redirect("http://localhost:3005/logout");
  return;
});

app.get("/login/oauth/battlenet", passport.authenticate("bnet"));

app.get(
  "/redirect",
  passport.authenticate("bnet", { failureRedirect: "/" }),
  function (req: SessionRequest, res: Response) {
    const redirectURL: URL = new URL("http://localhost:3005/callback");
    // redirectURL.search;
    // const params = new URLSearchParams({
    //   code: req.query.code,
    // });
    // redirectURL.search = params.toString();
    res.status(301).redirect(redirectURL.href);
  }
);
app.get(
  "/authenticated/test",
  (req: Request, res: Response, next: () => NextFunction) => {
    // Create a response object with the desired data
    const responseBody = {
      message: "Hello, world!",
      data: {
        h: "h",
      },
    };

    // Return the response as JSON
    console.log("ich geh hier rein", responseBody);
    res.status(200).json(responseBody);
    next();
  }
);

app.post("/testpost", (req: Request, res: Response) => {
  return res.status(200).json({
    bing: "bong",
  });
});

app.get(
  "/authenticated/characters",
  async (req: SessionRequest, res: Response, next: () => NextFunction) => {
    try {
      const characters = await characterService.getUsersCharactersList(
        req.user.token
      );
      res.json(characters);
      next();
    } catch (e) {
      res.status(500).json({ message: "Failed while fetching Characters" });
    }
  }
);

///authenticated/character/professions?name=Cdb&slug=Thrall&region=eu
app.get(
  "/authenticated/character/professions",
  async (req: SessionRequest, res: Response, next: () => NextFunction) => {
    try {
      console.log("is in professions");
      const { name, slug, region } = req.query;
      const professions = await characterService.getUserProfessionsToCharacter(
        req.user.token,
        name,
        slug
      );
      res.json(professions);
      next();
    } catch (e) {
      res.status(500).json({ message: "Failed while fetching Characters" });
    }
  }
);

app.get("/", (req: SessionRequest, res: Response) => {
  console.log("nice cookies!", req.cookies);
  if (req.isAuthenticated()) {
    return res.redirect("/authenticated");
  }
  // if (!req.isAuthenticated() && req.cookies["wow-trade-session"]) {
  //   console.log("redirectikus! ");
  //   return res.redirect("/logout");
  // }
  console.log("ist nicht authentifizifert > redirect to /login-");
  const redirectURL: URL = new URL("http://localhost:3005/ungracefully-logout");
  res.status(301).redirect(redirectURL.href);
});
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Worker  listening on port ${port}`));
