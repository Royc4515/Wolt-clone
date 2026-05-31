'use strict';

const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { notImplemented } = require('../controllers/genericController');

const router = express.Router();

router.post('/', ordersController.createOrder);

router.get('/', notImplemented);
router.get('/:id', notImplemented);
router.patch('/:id', notImplemented);
router.delete('/:id', notImplemented);

module.exports = router;
