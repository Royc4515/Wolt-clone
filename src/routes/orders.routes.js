'use strict';

const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { notImplemented } = require('../controllers/genericController');

const router = express.Router();

router.post('/', ordersController.createOrder);
router.get('/', ordersController.getAllOrders);

router.get('/:id', ordersController.getOrder);
router.patch('/:id', ordersController.updateOrder);
router.delete('/:id', notImplemented);

module.exports = router;