'use strict';

const bodyparser = require('body-parser');
const express = require('express');
const path = require('path');
const cors = require('cors');
const errorHandler = require('./errorHandler');
const RateLimit = require('express-rate-limit');

module.exports = (app) => {
    app.use(cors({ origin: '*' }));
    app.use(bodyparser.json());
    app.use(bodyparser.urlencoded({ extended: true }));
    app.use('/', new RateLimit({
        delayAfter: 0,
        max: 30
    }));

    app.use(express.static('docs'));
    app.use('/game', require('./route/game'));
    app.use('/invite', require('./route/invite'));
    app.use('/user', require('./route/user'));
    app.use('/group', require('./route/group'));
    app.use('/software', require('./route/software'));
    app.use('/admin', require('./route/admin'));

    app.use(errorHandler);
}
