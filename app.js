const Promise = require('bluebird');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const morgan = require('morgan');
const authenticatedGuard = require('./middleware/authenticated-guard');
const passport = require('./oauth/passport');
const OauthClient = require('./oauth/client');
const CharacterService = require('./services/CharacterService');
const createLogger = require('pino');

const url = require('url');
const logger = createLogger();
const cors = require('cors')

let redisClient;
if (process.env.REDIS_URL) {
    redisClient = redis.createClient(process.env.REDIS_URL);
} else {
    redisClient = redis.createClient({
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    });
}


const redisSessionStore = new RedisStore({
    client: redisClient
});

const oauthClient = new OauthClient();
const characterService = new CharacterService(oauthClient);

const app = express();

app.use((req, res, next) => {
    res.locals = {
        ...res.locals,
        projectName: process.env.PROJECT_NAME || 'WoW Trade API'
    };
    next();
});


app.use(cookieParser());

app.use(morgan('combined'));

app.use(session({
    name: 'wow-trade-session',
    secret: 'wow-trade-secret',
    saveUninitialized: true,
    resave: true,
    store: redisSessionStore,
}));

app.use(passport.initialize({}));

app.use(passport.session({}));

app.use(cors())

app.use((req, res, next) => {
    if (req.isAuthenticated()) {
        console.log('is authenticated', req.user)
        res.locals.currentUser = req.user;
        return next();
    }
    console.log('next step, nicht eingeloggt', req)
    next();
});

app.use('/authenticated', authenticatedGuard);

app.get('/login', (req, res) => {
    res.redirect('/login/oauth/battlenet');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/login/oauth/battlenet',    passport.authenticate('bnet'));

app.get('/redirect',
    passport.authenticate('bnet', {failureRedirect: '/'}),
    function (req, res) {
        const redirectURL = new URL('http://localhost:3005/callback');
        redirectURL.search = new URLSearchParams({
            code: req.query.code
        })
    res.status(301).redirect(redirectURL)
    })
app.get('/authenticated/test', (req, res, next) => {
    // Create a response object with the desired data
    const responseBody = {
        message: 'Hello, world!',
        data: {
            h: 'h'
        },
    };

    // Return the response as JSON
    console.log('ich geh hier rein', responseBody)
    res.status(200).json(responseBody);
    next();
});

app.post('/testpost', (req, res)=> {
    return res.status(200).json({
        bing: 'bong'
    })
})

app.get('/authenticated/characters', async (req, res, next) => {
    try {
        const characters = await characterService.getUsersCharactersList(req.user.token);
        res.json(characters);
        next();
    } catch (e) {
       res.status(500).json({message: 'Failed while fetching Characters'})
    }
});

app.get('/authenticated/character/professions', async (req, res, next) => {
    try {
        console.log('body', req.body)
        const characters = await characterService.getUserProfessionsToCharacter(req.user.token, 'Recoíl', 'thrall');
        res.json(characters);
        next();
    } catch (e) {
       res.status(500).json({message: 'Failed while fetching Characters'})
    }
});


app.get('/',
    (req, res, next) => {
    console.log('nice cookies!', req.cookies)
        if (req.isAuthenticated()) {
            return res.redirect('/authenticated');
        }
        console.log('is in landing ')
        res.send({data: 'redirected to `/`'})
    },
);

module.exports = async () => {
    await oauthClient.getToken();
    return Promise.resolve(app);
};
