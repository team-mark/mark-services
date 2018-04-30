import { Router } from 'express';

const router: Router = Router();
const api: Router = Router();

const currentVersion = 'v0';

const tokens = require(`../services/${currentVersion}/api/tokens`);
const users = require(`../services/${currentVersion}/api/users`);
const accounts = require(`../services/${currentVersion}/api/accounts`);

api.use('/users', users);
api.use('/tokens', tokens);
api.use('/accounts', accounts);

router.use('/api', api);
router.use(`/api/${currentVersion}`, api);

module.exports = router;