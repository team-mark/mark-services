"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
module.exports = router;
router.get('/', index);
router.get('/teapot', teapot);
router.get('/welcome', welcome);
function index(req, res, next) {
    res.render('index', {
        title: 'Node JS API App'
    });
}
function welcome(req, res, next) {
    res.send({ hello: 'world' });
}
function teapot(req, res, next) {
    res.send({ 'I\'m': 'a teapot' });
}