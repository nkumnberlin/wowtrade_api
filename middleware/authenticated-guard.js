/**
 * Middleware 'gate' that will redirect to `/` if the request/user
 * is not authenticated.
 */
module.exports = (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.log('____________ zurueck  _______')
        return res.redirect('/');
    }
    console.log('____________ weiter gehts _______')
    next();
};
