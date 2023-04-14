import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { authenticator } from '../../oauth/bnetPassport';

export const authenticationController: FastifyPluginCallback = (app, opts, done) => {
  app.get('/login', (req, res) => {
    res.redirect('/login/oauth/battlenet');
  });

  app.get('/logout', (req, res) => {
    console.log('session id ', req.session.sessionId);
    // @ts-ignore
    req.session.destroy();
    return res.send({
      status: 201,
      message: 'Logged out',
    });
  });

  app.get('/login/oauth/battlenet', authenticator.authenticate('bnet'));

  app.get(
    '/redirect',
    { preValidation: authenticator.authenticate('bnet', { failureRedirect: '/' }) },
    (req, res) => {
      const redirectURL: URL = new URL(`${req.headers.referer}/callback`);
      res.status(301).redirect(redirectURL.href);
    }
  );
  app.get('/', (req: FastifyRequest, res: FastifyReply) => {
    console.log('nice cookies!', req.cookies);
    if (req.isAuthenticated()) {
      return res.redirect('/authenticated');
    }
    console.log('ist nicht authentifizifert > redirect to /login-');
    const redirectURL: URL = new URL('/ungracefully-logout');
    return res.status(301).redirect(redirectURL.href);
  });
  done();
};
