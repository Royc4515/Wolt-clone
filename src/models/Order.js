const mongoose = require('mongoose');

// Inner schema for each product within the order.
const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
});

// Main schema for order.
const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    restaurantId: { type: String, required: true },
    items: [orderItemSchema],
    mode: { type: String, enum: ['delivery', 'pickup'], required: true },
    paymentMethod: { type: String, required: true },
    cutlery: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    tip: { type: Number, default: 0 },
    pricing: {
        subtotal: { type: Number, required: true },
        serviceFee: { type: Number, required: true },
        deliveryFee: { type: Number, required: true },
        finalTip: { type: Number, required: true },
        total: { type: Number, required: true }
    },
    estimatedTime: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'on_the_way', 'delivered', 'cancelled'],
        default: 'pending'
    },
    statusHistory: [{
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

// Ensure the schema is defined only once.
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Order;