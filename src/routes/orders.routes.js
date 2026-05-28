'use strict';

const express = require('express');
const { notImplemented } = require('../controllers/genericController');

const router = express.Router();

router.all('/', notImplemented);
router.all('/:id', notImplemented);

module.exports = router;
