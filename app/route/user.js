'use strict';

const router = require('express').Router();
const wrap = require('async-middleware').wrap;
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const middleware = require('../middleware')

const Server = require('../Server');

const usernameRegex = /^[0-9_a-z\-]{3,32}$/i;
const passwordRegex = /^[0-9a-f]{64}$/;

// Show your own info
router.get('/me', [ middleware.authentication ], (req, res) => {
    res.status(200).json(Server.sys.user.info(req.locals.user));
});

// Register a new user
router.post('/register', [
    check('username').matches(usernameRegex).withMessage('Username must be between 3 and 32 characters long, allowed characters: 0-9, a-z, _ and -'),
    check('password').matches(passwordRegex),
    check('invite').isLength({ max: 255 }),
    check('mail').isLength({ max: 255 }).isEmail()
], wrap(async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    const data = matchedData(req);
    try
    {
        const key = await Server.sys.user.register(data);
        res.status(201).end(key);
    } catch (e)
    {
        res.status(400).end(e.message);
    }
}));

// Get user info
router.get('/id/:name', (req, res) => {
    res.status(501).end();
});

// Get user by Steam ID
router.get('/steam/:steam', [
    check('steam').matches(/^\d{1,10}$/)
], wrap(async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    const data = matchedData(req);
    const user = await Server.db.getUserBySteamId(data.steam);
    if (user)
        res.status(200).json(Server.sys.user.info(user));
    else
        res.status(404).end('Not found');
}));

// Return access key
router.post('/login', [
    check('username').matches(usernameRegex),
    check('password').matches(passwordRegex)
], wrap(async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });
    const data = matchedData(req);
    const key = await Server.sys.user.login(data.username, data.password);
    if (key == null)
        res.status(401).end('null');
    else
        res.status(200).end(key);
}));

// Generate new access key
router.post('/reset_key', (req, res) => {
    res.status(501).end();
});

module.exports = router;
