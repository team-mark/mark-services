"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
module.exports = router;
router.get('/', user);
function user(req, res, next) {
    res.send({ username: 'ferrantejake' });
}