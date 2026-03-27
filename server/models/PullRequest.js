const mongoose = require('mongoose');

const PullRequestSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String,
        trim: true 
    },
    sourceRepoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Repository', 
        required: true 
    },
    targetRepoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Repository', 
        required: true 
    },
    sourceBranchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Branch', 
        required: true 
    },
    targetBranchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Branch', 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['open', 'merged', 'closed'], 
        default: 'open' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('PullRequest', PullRequestSchema);
