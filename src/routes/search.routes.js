'use strict';

const express = require('express');
const { notImplemented } = require('../controllers/genericController');

const router = express.Router();

router.all('/', notImplemented);
router.all('/:query', notImplemented);

module.exports = router;
