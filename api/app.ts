// Require the framework
import { app as apiApp } from '../src/app';

export default async (req: any, res: any) => {
  await apiApp.ready();
  apiApp.server.emit('request', req, res);
};

// "use strict";
//
// // Read the .env file.
// import * as dotenv from "dotenv";
// dotenv.config();
//
// // Require the framework
// import Fastify from "fastify";
//
// // Instantiate Fastify with some config
// const app = Fastify({
//   logger: true,
// });
//
// // Register your application as a normal plugin.
// app.register(apiApp);
//
// export default async (req, res) => {
//   await app.ready();
//   app.server.emit('request', req, res);
// }
