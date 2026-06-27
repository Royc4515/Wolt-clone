const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        description: { type: String, default: '' },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        phone:        { type: String,  default: '' },
        openHours:    { type: String,  default: '' },
        isPromoted:   { type: Boolean, default: false },
        rating:       { type: Number,  default: 0 },
        image:        { type: String,  default: '' },
        deliveryFee:  { type: Number,  default: 0 },
        deliveryTime: { type: Number,  default: 30 },
        ownerId:      { type: String,  required: true },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
