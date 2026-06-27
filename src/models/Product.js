const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name:         { type: String,  required: [true, 'Name is required'], trim: true },
        description:  { type: String,  default: '' },
        price:        { type: Number,  required: [true, 'Price is required'] },
        section:      { type: String,  required: [true, 'Section is required'], trim: true },
        sectionOrder: { type: Number,  default: 2 },
        isAvailable:  { type: Boolean, default: true },
        image:        { type: String,  default: '' },
        restaurantId: { type: String,  required: true },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('Product', productSchema);
