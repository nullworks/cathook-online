'use strict';

const router = require('express').Router();
const wrap = require('async-middleware').wrap;
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const middleware = require('../middleware');
const Server = require('../Server');

// Store stats (kills, etc) on round end
router.post('/store', (req, res) => {
    throw new Server.errors.NotImplemented();
});

// Keep the user online/ingame/etc status
router.post('/online', (req, res) => {
    throw new Server.errors.NotImplemented();
});

// Set current SteamID and stuff
router.post('/startup', [
    check('steam').matches(/^\d{1,10}$/),
    middleware.authentication
], wrap(async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        throw new Server.errors.UnprocessableEntity({ errors: errors.array() });
    const data = matchedData(req);
    await Server.sys.game.claimSteamId(req.locals.user, data.steam);
    res.status(200).end();
}));

// Identify array of SteamIDs (separated by ,)
router.get('/identify', [
    check('ids').matches(/^(\d{1,10},?)+$/),
    middleware.authentication
], (async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        throw new Server.errors.UnprocessableEntity({ errors: errors.array() });
    const data = matchedData(req);
    const ids = data.ids.split(',');
    const identified = await Server.sys.game.identify(ids);
    res.status(200).json(identified);
}));

module.exports = router;