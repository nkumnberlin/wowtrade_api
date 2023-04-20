import { app as apiApp } from '../src/app';
import { killConnection } from '../src/services/database';

function exitHandler() {
  Promise.all([killConnection(), apiApp.close()])
    .then(() => process.exit())
    .catch(process.exit);
}
export default async (req: any, res: any) => {
  await apiApp.ready();
  process.on('exit', exitHandler.bind(null));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null));
  process.on('SIGUSR2', exitHandler.bind(null));

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null));

  apiApp.server.emit('request', req, res);
};
