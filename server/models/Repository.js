const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driveFolderId: {
        type: String,
        required: true
    },
    currentDocId: {
        type: String,
        required: false
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    forkedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Repository', RepositorySchema);
