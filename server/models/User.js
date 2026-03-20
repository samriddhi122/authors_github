const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    accessToken: String,
    refreshToken: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', UserSchema);
