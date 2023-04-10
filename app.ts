import { NextFunction, Request, Response } from "express";
require("dotenv").config();
import { initializeDatabase } from "./services/database";
import { ExpectingListingData, ListingData } from "./services/types";
import {
  findLastFiveCreatedListings,
  findByCreatorAccountId,
  findByItemName,
  saveListing,
  deleteListingOfUser,
  findByItemID,
} from "./services/ListingService";
import bodyParser from "body-parser";
import { createOrderMapper } from "./helper/order/createOrderMapper";
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
const { getAllProfessionSkillTrees } = require("./services/ProfessionService");

const cors = require("cors");

interface AuthenticatedRequest extends Request {
  isAuthenticated: () => boolean;
  user: any;
}
interface SessionRequest extends AuthenticatedRequest {
  query: {
    code: string;
    name: string;
    slug: string;
    region: string;
  };
}

interface OrderCreateRequest extends AuthenticatedRequest {
  body: ExpectingListingData;
}

interface OrderFetchRequest extends AuthenticatedRequest {
  query: {
    itemName?: string;
    id_crafted_item?: string;
    accountId?: string;
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
const jsonParser = bodyParser.json();

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

app.use(passport.session());

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
  console.log("session id ", req.sessionID);
  // @ts-ignore
  req.session.destroy();
  return res.send({
    status: 201,
    message: "Logged out",
  });
});

app.get("/login/oauth/battlenet", passport.authenticate("bnet"));

app.get(
  "/redirect",
  passport.authenticate("bnet", { failureRedirect: "/" }),
  function (req: SessionRequest, res: Response) {
    const redirectURL: URL = new URL("http://localhost:3005/callback");
    res.status(301).redirect(redirectURL.href);
  }
);

app.get("/professions", async (req: SessionRequest, res: Response) => {
  try {
    const allProfessions = await getAllProfessionSkillTrees();
    return res.status(200).json({
      status: 200,
      data: allProfessions,
    });
  } catch (e) {
    console.log("error while in professions", e);
    return res.status(500).json({
      status: 500,
      message: "Error while fetching Professions",
    });
  }
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

app.post(
  "/authenticated/order",
  jsonParser,
  async (req: OrderCreateRequest, res: Response, next: () => NextFunction) => {
    try {
      const listingData = req.body;
      listingData.creatorAccountId = req.user.id;
      const orderDTO = createOrderMapper(listingData);
      console.log("0der", orderDTO);
      const createdOrder = await saveListing(orderDTO);
      return res.json(createdOrder).status(201);
    } catch (e) {
      console.log("error while created", e);
      return res.status(500).json({
        status: 500,
        message: `Failed while creating order. ${e}`,
      });
    }
  }
);

app.delete(
  "/authenticated/order",
  async (req: OrderFetchRequest, res: Response, next: () => NextFunction) => {
    const { id_crafted_item } = req.query;
    const creatorAccountId = req.user.id;
    if (!id_crafted_item) {
      return res.status(500).json({
        status: 500,
        message: "id does not exist",
      });
    }
    const itemId = parseInt(id_crafted_item, 10);
    console.log("in delete, ", id_crafted_item);
    try {
      const deleteOrder = await deleteListingOfUser(itemId, creatorAccountId);
      res.status(201).json({
        status: 201,
        message: "successfully deleted",
      });
    } catch (e) {
      res.status(500).json({
        status: 500,
        message: `Failed while deleting order. ${e}`,
      });
    }
  }
);
app.get(
  "/viewLast5",
  async (req: OrderFetchRequest, res: Response, next: () => NextFunction) => {
    console.log("ist in order");
    const lastFiveOrders = await findLastFiveCreatedListings();
    res.json(lastFiveOrders).status(200);
    next();
  }
);
app.get(
  "/order",
  async (req: OrderFetchRequest, res: Response, next: () => NextFunction) => {
    const { id_crafted_item } = req.query;
    if (!id_crafted_item) return res.json(500).json({ status: 500 });
    console.log("id: ", id_crafted_item);
    const int_crafted_item = parseInt(id_crafted_item, 10);
    const allItems = await findByItemID(int_crafted_item);
    console.log("aall items", allItems);
    return res
      .json({
        data: allItems,
        status: 200,
      })
      .status(200);
  }
);

app.get(
  "/authenticated/order",
  async (req: OrderFetchRequest, res: Response, next: () => NextFunction) => {
    try {
      const accountId = req.user.id;
      console.log("req user", req.user);

      // if (itemName) {
      //   const ordersByItemName = await findByItemName(itemName);
      //   res.json(ordersByItemName).status(200);
      //   return next();
      // }
      if (accountId) {
        const ordersByAccountCreatorId = await findByCreatorAccountId(
          parseInt(accountId)
        );
        res.json(ordersByAccountCreatorId).status(200);
        return next();
      }
      return next();
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

initializeDatabase().then(() =>
  app.listen(port, () => console.log(`Worker  listening on port ${port}`))
);
