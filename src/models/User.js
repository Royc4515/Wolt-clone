const mongoose = require('mongoose');

// Define the structure for the User document in MongoDB.
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long']
        },
        displayName: {
            type: String,
            required: [true, 'Display name is required'],
            trim: true
        },
        profilePicture: {
            type: String,       // A URL or base64 string.
            required: [true, 'Profile picture is required']
        },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer'
        }
    },
    {
        // Automatically manage createdAt and updatedAt fields.
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);