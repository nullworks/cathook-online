'use strict';

const { validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const Server = require('./Server');

module.exports = {
    authentication: require('./mw/authentication'),
    authorization: require('./mw/authorization'),
    ratelimit: require('./mw/ratelimit'),
    passedAllChecks: function (req, res, next)
    {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            throw new Server.errors.UnprocessableEntity(errors.array());
        req.locals.data = matchedData(req);
        next();
    }
}
