const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
    repoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    currentDocId: {
        type: String,
        required: true
    },
    headCommitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commit',
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Branch', BranchSchema);
