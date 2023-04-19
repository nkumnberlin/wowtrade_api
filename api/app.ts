// Require the framework
import Fastify from 'fastify';

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
// @ts-ignore
app.register(import('../src/app'));

export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};
