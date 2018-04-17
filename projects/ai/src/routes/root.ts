import { Router } from 'express';

const router: Router = Router();

const version = 'v0';

const home = require(`../services/${version}/home`);
const users = require(`../services/${version}/users`);

router.use('/', home);
router.use('/users', users);

module.exports = router;