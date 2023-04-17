import {FastifyPluginCallback, FastifyReply, FastifyRequest} from 'fastify';
import {authenticator} from '../../oauth/bnetPassport';

export const authenticationController: FastifyPluginCallback = (app, opts, done) => {
    app.get('/login', (req, res) => {
        res.redirect('/login/oauth/battlenet');
    });

    app.get('/logout', async (req, res) => {
        console.log('session id ', req.session.sessionId);
        await req.session.destroy();
        const invalidationDate = new Date();
        invalidationDate.setMilliseconds(invalidationDate.getMilliseconds() + 3000);
        return res.status(200).cookie("wow-trade-session", "", {maxAge: 0}).send({
            status: 200,
            message: 'Logged out',
        }).redirect("/");

    });

    app.get('/login/oauth/battlenet', authenticator.authenticate('bnet'));

    app.get(
        '/redirect',
        {preValidation: authenticator.authenticate('bnet', {failureRedirect: '/'})},
        (req, res) => {
            const redirectURL: URL = new URL(`${req.headers.referer}callback`);
            console.log('nu, was kommt an hier2: ', redirectURL);
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
