const express = require('express');
const router = express.Router({ mergeParams: true });
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const Commit = require('../models/Commit');
const { getGoogleApis, copyDocument } = require('../utils/googleDocs');

// Middleware to check authentication
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

// @desc    Get all commits for a specific repository
// @route   GET /repos/:repoId/commits
router.get('/', ensureAuth, async (req, res) => {
    try {
        const repo = await Repository.findById(req.params.repoId);
        if (!repo) {
            return res.status(404).json({ error: 'Repository not found' });
        }
        if (repo.ownerId.toString() !== req.user._id.toString() && repo.visibility !== 'public') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Determine active branch
        const activeBranch = await Branch.findOne({ repoId: repo._id, currentDocId: repo.currentDocId });
        
        let query = { repoId: req.params.repoId };
        if (activeBranch) {
            // Isolate history to just this branch!
            // Legacy commits without a branchId will be hidden on branched histories unless querying main
            query.branchId = activeBranch._id; 
        }

        // Fetch commits for the active branch only
        const commits = await Commit.find(query).sort({ createdAt: 'desc' });
        res.json({ success: true, commits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error fetching commits' });
    }
});

// @desc    Create a new commit snapshot
// @route   POST /repos/:repoId/commits
router.post('/', ensureAuth, async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Commit message is required' });
    }

    try {
        // 1. Verify Repository exists and user owns it
        const repo = await Repository.findById(req.params.repoId);
        if (!repo || repo.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to commit to this repository' });
        }

        if (!repo.currentDocId) {
            return res.status(400).json({ error: 'No active document found to commit' });
        }

        // 2. Interface with Google Drive APIs
        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);

        // Determine if there is a previous commit to establish a parent
        const lastCommit = await Commit.findOne({ repoId: repo._id }).sort({ createdAt: -1 });
        const snapshotName = `Commit: ${message.substring(0, 20)}`;

        // Determine active branch for tagging
        const activeBranch = await Branch.findOne({ repoId: repo._id, currentDocId: repo.currentDocId });

        // 3. Make a physical copy of the Google Document 
        const snapshotDocId = await copyDocument(drive, repo.currentDocId, snapshotName, repo.driveFolderId);

        // 4. Save the commit instance to MongoDB, strictly isolating it to the active branch
        const newCommit = await Commit.create({
            repoId: repo._id,
            branchId: activeBranch ? activeBranch._id : undefined,
            docId: snapshotDocId,
            message: message,
            parentCommitId: lastCommit ? lastCommit._id : null
        });

        res.status(201).json({
            success: true,
            commit: newCommit
        });
    } catch (err) {
        console.error('Error creating commit:', err);
        res.status(500).json({ error: 'Failed to create commit' });
    }
});

module.exports = router;
