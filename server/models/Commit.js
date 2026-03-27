const mongoose = require('mongoose');

const CommitSchema = new mongoose.Schema({
    repoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false
    },
    docId: {
        type: String,
        required: true
    },
    parentCommitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commit',
        required: false
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Commit', CommitSchema);
