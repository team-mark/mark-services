import * as express from 'express';
const pkg = require('../../package.json');

const router: express.Router = express.Router();
const api: express.Router = express.Router();

const currentVersion = 'v0';

const tokens = require(`../services/${currentVersion}/api/tokens`);
const users = require(`../services/${currentVersion}/api/users`);
const accounts = require(`../services/${currentVersion}/api/accounts`);
const marks = require(`../services/${currentVersion}/api/marks`);
const likes = require(`../services/${currentVersion}/api/likes`);

api.use('/users', users);
api.use('/tokens', tokens);
api.use('/accounts', accounts);
api.use('/marks', marks);
api.use('/likes', likes);

router.use(`/api`, api);
router.use(`/api/${currentVersion}`, api);

router.get('/', index);

router.use('/', (req: express.Request, res: express.Response) => {
    res.sendStatus(404);
});

// Home page
function index(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const DOCS_URL = process.env.MS_DOCS_URL;
    res.render('index', { title: 'Mark API', docs: DOCS_URL, version: pkg.version });
}

module.exports = router;