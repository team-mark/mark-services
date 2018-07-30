"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const pkg = require('../../package.json');
const router = express.Router();
const api = express.Router();
const currentVersion = 'v0';
const accounts = require(`../services/${currentVersion}/api/accounts`);
const feed = require(`../services/${currentVersion}/api/feed`);
const likes = require(`../services/${currentVersion}/api/likes`);
const marks = require(`../services/${currentVersion}/api/marks`);
const tokens = require(`../services/${currentVersion}/api/tokens`);
const users = require(`../services/${currentVersion}/api/users`);
api.use('/accounts', accounts);
api.use('/feed', feed);
api.use('/likes', likes);
api.use('/marks', marks);
api.use('/tokens', tokens);
api.use('/users', users);
router.use(`/api`, api);
router.use(`/api/${currentVersion}`, api);
router.get('/', index);
router.use('/', (req, res) => {
    res.sendStatus(404);
});
function index(req, res, next) {
    const DOCS_URL = process.env.MS_DOCS_URL;
    res.render('index', { title: 'Mark API', docs: DOCS_URL, version: pkg.version });
}
module.exports = router;