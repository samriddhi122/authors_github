const express = require('express');
const router = express.Router();
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const { getGoogleApis, createDriveFolder, createDocInFolder } = require('../utils/googleDocs');

// Middleware to check authentication
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

// @desc    Create a new repository (story)
// @route   POST /repos
router.post('/', ensureAuth, async (req, res) => {
    const { name, description, visibility } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Repository name is required' });
    }

    try {
        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);

        // 1. Create a folder in Google Drive
        const folderId = await createDriveFolder(drive, `StoryHub_${name}`);

        // 2. Create the initial document (chapter1) inside that folder
        const initialDocId = await createDocInFolder(drive, 'chapter1', folderId);

        // 3. Save repository details mapped to the Drive folder in the DB
        const newRepo = await Repository.create({
            name,
            description,
            visibility: visibility || 'public',
            ownerId: req.user._id,
            driveFolderId: folderId,
            currentDocId: initialDocId,
        });

        // 4. Create the default 'main' branch
        await Branch.create({
            repoId: newRepo._id,
            name: 'main',
            currentDocId: initialDocId
        });

        res.status(201).json({
            success: true,
            repository: newRepo,
            initialDocId
        });
    } catch (err) {
        console.error('Error creating repository:', err);
        res.status(500).json({ error: 'Failed to create repository' });
    }
});

// @desc    Get all repositories for logged in user
// @route   GET /repos
router.get('/', ensureAuth, async (req, res) => {
    try {
        const repos = await Repository.find({ ownerId: req.user._id }).sort({ createdAt: 'desc' });
        res.json({ success: true, repositories: repos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error fetching repositories' });
    }
});

// @desc    Switch working branch for a repository
// @route   PUT /repos/:repoId/switch
router.put('/:repoId/switch', ensureAuth, async (req, res) => {
    const { branchId } = req.body;
    try {
        const repo = await Repository.findById(req.params.repoId);
        if (!repo || repo.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const branch = await Branch.findById(branchId);
        if (!branch || branch.repoId.toString() !== repo._id.toString()) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        repo.currentDocId = branch.currentDocId;
        await repo.save();

        res.json({ success: true, repository: repo, branchName: branch.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error switching branches' });
    }
});

module.exports = router;
