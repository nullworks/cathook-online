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
router.get('/me', [ 
    middleware.authentication
], (req, res) => {
    res.status(200).json(Server.sys.user.info(req.locals.user));
});

// Register a new user
router.post('/register', [
    check('username').matches(usernameRegex).withMessage('Username must be between 3 and 32 characters long, allowed characters: 0-9, a-z, _ and -'),
    check('password').matches(passwordRegex),
    check('invite').isLength({ max: 255 }),
    check('mail').isLength({ max: 255 }).isEmail(),
    check('software').optional().isNumeric(),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    const key = await Server.sys.user.register(req.locals.data);
    res.status(201).end(key);
}));

// Get user info
router.get('/id/:name', [
    check('name').matches(usernameRegex),
    middleware.passedAllChecks,
    middleware.authentication
], wrap(async function(req, res) {
    const user = await Server.db.getUserByUsername(req.locals.data.name);
    
    const sw = await Server.sys.software.getSoftware(user.software_id);
    const groups = await Server.sys.user.getGroups(req.locals.data.name);

    const result = {
        username: user.username,
        registered_at: user.registered_at,
        software: sw ? sw.name : null,
        color: user.color,
        groups: groups.map(group => {
            return {
                name: group.name,
                display: group.display
            }
        })
    };

    res.status(200).json(result);
}));

// Get user by Steam ID
router.get('/steam/:steam', [
    check('steam').matches(/^\d{1,10}$/),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    const user = await Server.db.getUserBySteamId(req.locals.data.steam);
    if (user)
    {
        const groups = await Server.sys.user.getGroups(user.username);
        const software = await Server.sys.software.getSoftware(user.software_id);
        res.status(200).json({
            username: user.username,
            verified: user.verified,
            color: user.color,
            groups: groups.map(group => {
                return {
                    name: group.name,
                    display: group.display
                }
            }),
            software: software == null ? null : {
                name: software.name,
                friendly: software.friendly
            }
        });
    }
    else
        throw new Server.errors.NotFound();
}));

// Return access key + user data
router.post('/login', [
    check('username').matches(usernameRegex),
    check('password').matches(passwordRegex),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    const data = await Server.sys.user.login(req.locals.data.username, req.locals.data.password);
    if (data == null)
        throw new Server.errors.InternalServerError();
    else
        res.status(200).json(data);
}));

// Add user group
router.post('/id/:name/group/:id', [
    middleware.authentication,
    middleware.notAnonymous,
    middleware.authorization(),
    check('name').matches(usernameRegex),
    check('id').isNumeric(),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    const data = req.locals.data;
    await Server.sys.user.addGroup(data.name, data.id);
    res.status(200).end();
}));

// Remove group
router.delete('/id/:name/group/:id', [
    middleware.authentication,
    middleware.notAnonymous,
    middleware.authorization(),
    check('name').matches(usernameRegex),
    check('id').isNumeric(),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    const data = req.locals.data;
    await Server.sys.user.removeGroup(data.name, data.id);
    res.status(200).end();
}));

// Update software
router.put('/id/:name/software/:id', [
    middleware.authentication,
    middleware.notAnonymous,
    check('name').matches(usernameRegex),
    check('id').isNumeric(),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    await Server.sys.user.setSoftware(req.locals.user.username, req.locals.data.id);
    res.status(200).end();
}));

// Update color
router.put('/id/:name/color/:color', [
    middleware.authentication,
    middleware.notAnonymous,
    middleware.authorization({ groups: ['color'] }),
    check('name').matches(usernameRegex),
    check('color').matches(/^[0-9a-f]{6}$/),
    middleware.passedAllChecks
], wrap(async function(req, res) {
    await Server.sys.user.setColor(req.locals.user.username, req.locals.data.color);
    res.status(200).end();
}));

// Get a range of SteamIDs associated with user
router.get('/id/:name/steam/:start/:count', [
    check('name').matches(usernameRegex),
    check('start').isNumeric(),
    check('count').isNumeric(),
    middleware.passedAllChecks,
    middleware.authentication,
    middleware.notAnonymous    
], wrap(async function(req, res) {
    throw new Server.errors.NotImplemented();
}));

// Verify SteamID
router.post('/id/:name/steam/:steam/verify', [
    check('name').matches(usernameRegex),
    check('steam').matches(/^\d{1,10}$/),
    middleware.passedAllChecks,
    middleware.authentication,
    middleware.notAnonymous,
    middleware.authorization({ groups: ['can_verify'] }),
], wrap(async function(req, res) {
    throw new Server.errors.NotImplemented();
}));

// Un-verify SteamID
router.delete('/id/:name/steam/:steam/verify', [
    check('name').matches(usernameRegex),
    check('steam').matches(/^\d{1,10}$/),
    middleware.passedAllChecks,
    middleware.authentication,
    middleware.notAnonymous,
    middleware.authorization({ groups: ['can_verify'] }),
], wrap(async function(req, res) {
    throw new Server.errors.NotImplemented();
}));

// Delete SteamID
router.delete('/id/:name/steam/:steam', [
    check('name').matches(usernameRegex),
    check('steam').matches(/^\d{1,10}$/),
    middleware.passedAllChecks,
    middleware.authentication,
    middleware.notAnonymous,
    middleware.authorization({ groups: ['can_verify'] }),
], wrap(async function(req, res) {
    throw new Server.errors.NotImplemented();
}));

// Generate new access key
router.post('/reset_key', (req, res) => {
    throw new Server.errors.NotImplemented();
});

module.exports = router;
