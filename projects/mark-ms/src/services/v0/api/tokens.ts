import * as express from 'express';
const router = express.Router();
module.exports = router;

// Routes
router.get('/', user);

// Route definitions
function user(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.send({ username: 'ferrantejake' });
}