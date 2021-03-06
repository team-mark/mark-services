import * as express from 'express';
const pkg = require('../../package.json');

const router: express.Router = express.Router();
const api: express.Router = express.Router();

const currentVersion = 'v0';

const accounts = require(`../services/${currentVersion}/api/accounts`);
const feed = require(`../services/${currentVersion}/api/feed`);
const followers = require(`../services/${currentVersion}/api/followers`);
const following = require(`../services/${currentVersion}/api/following`);
const likes = require(`../services/${currentVersion}/api/likes`);
const marks = require(`../services/${currentVersion}/api/marks`);
const search = require(`../services/${currentVersion}/api/search`);
const tokens = require(`../services/${currentVersion}/api/tokens`);
const users = require(`../services/${currentVersion}/api/users`);

api.use('/accounts', accounts);
api.use('/feed', feed);
api.use('/followers', followers);
api.use('/following', following);
api.use('/likes', likes);
api.use('/marks', marks);
api.use('/search', search);
api.use('/tokens', tokens);
api.use('/users', users);

router.use(`/api`, api);
router.use(`/api/${currentVersion}`, api);

router.get('/', index);

router.use('/', (req: express.Request, res: express.Response) => {
    console.log('dead end');
    res.sendStatus(404);
});

// Home page
function index(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const DOCS_URL = process.env.MS_DOCS_URL;
    res.render('index', { title: 'Mark API', docs: DOCS_URL, version: pkg.version });
}

module.exports = router;