// Require the framework
import { app as apiApp } from '../src/app';

export default async (req: any, res: any) => {
  await apiApp.ready();
  apiApp.server.emit('request', req, res);
};
