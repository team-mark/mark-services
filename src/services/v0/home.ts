import * as express from 'express';
const router = express.Router();
module.exports = router;

// Routes
router.get('/', index);
router.get('/teapot', teapot);
router.get('/welcome', welcome);

// Route definitions
function index(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.render('index', {
    title: 'Node JS API App'
  });
}

function welcome(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.send({ hello: 'world' });
}

function teapot(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.send({ 'I\'m': 'a teapot' });
}