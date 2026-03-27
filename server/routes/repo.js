const express = require('express');
const router = express.Router();
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const PullRequest = require('../models/PullRequest');
const { getGoogleApis, createDriveFolder, createDocInFolder, makeFilePublic, copyDocument, grantUserReadAccess } = require('../utils/googleDocs');

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

        // Guarantee native API permission boundaries if public
        if (visibility === 'public' || !visibility) {
            await makeFilePublic(drive, folderId);
            await makeFilePublic(drive, initialDocId); // Explicitly required for Google Drive cross-account Fork accessibility!
        }

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

// @desc    Get all public repositories across the platform for Community Discovery
// @route   GET /repos/public
router.get('/public', ensureAuth, async (req, res) => {
    try {
        const publicRepos = await Repository.find({ visibility: 'public' })
            .populate('ownerId', 'displayName image')
            .sort({ createdAt: 'desc' });
        res.json({ success: true, repositories: publicRepos });
    } catch (err) {
        console.error('Error fetching public repos:', err);
        res.status(500).json({ error: 'Failed to fetch community stories' });
    }
});

// @desc    Get all incoming PRs for the logged-in user
// @route   GET /repos/notifications/pulls
router.get('/notifications/pulls', ensureAuth, async (req, res) => {
    try {
        const myRepos = await Repository.find({ ownerId: req.user._id }).select('_id');
        const repoIds = myRepos.map(r => r._id);

        const incomingPrs = await PullRequest.find({ targetRepoId: { $in: repoIds }, status: 'open' })
            .populate('sourceRepoId', 'name ownerId')
            .populate('targetRepoId', 'name')
            .populate('sourceBranchId', 'name')
            .populate('targetBranchId', 'name')
            .populate({
                path: 'sourceRepoId',
                populate: { path: 'ownerId', select: 'displayName image email' }
            })
            .sort({ createdAt: -1 });

        res.json({ success: true, notifications: incomingPrs });
    } catch (err) {
        console.error('Error fetching global PR notifications:', err);
        res.status(500).json({ error: 'Failed to fetch notifications' });
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

// @desc    Fork a public repository to my own account
// @route   POST /repos/:repoId/fork
router.post('/:repoId/fork', ensureAuth, async (req, res) => {
    try {
        const originalRepo = await Repository.findById(req.params.repoId).populate('ownerId');
        if (!originalRepo || originalRepo.visibility !== 'public') return res.status(404).json({ error: 'Repo not found or private' });
        
        // Bypassed for local testing so you can fork your own repositories!
        // if (originalRepo.ownerId._id.toString() === req.user._id.toString()) return res.status(400).json({ error: 'Cannot fork your own repository' });

        const existingFork = await Repository.findOne({ ownerId: req.user._id, forkedFrom: originalRepo._id });
        if (existingFork) return res.status(400).json({ error: 'You already forked this storyline!' });

        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);

        const folderId = await createDriveFolder(drive, `StoryHub_Fork_${originalRepo.name}`);

        // EXPLICIT GRANT OVERRIDE: Original author silently whitelists the Forker's exact email address!
        await grantUserReadAccess(
            originalRepo.ownerId.accessToken, 
            originalRepo.ownerId.refreshToken, 
            originalRepo.currentDocId, 
            req.user.email
        );

        // DELAY: We must pause execution while Google's global server farms propagate the new ACL permission!
        await new Promise(resolve => setTimeout(resolve, 2500));

        const forkedDocName = `${originalRepo.name} (Fork)`;
        const newDocId = await copyDocument(drive, originalRepo.currentDocId, forkedDocName, folderId);

        const newRepo = await Repository.create({
            name: `${originalRepo.name} (Fork)`,
            description: `Forked from ${originalRepo.ownerId.displayName}`,
            visibility: 'public',
            ownerId: req.user._id,
            driveFolderId: folderId,
            currentDocId: newDocId,
            forkedFrom: originalRepo._id
        });

        await makeFilePublic(drive, folderId);
        await makeFilePublic(drive, newDocId);

        await Branch.create({
            repoId: newRepo._id,
            name: 'main',
            currentDocId: newDocId
        });

        res.status(201).json({ success: true, repository: newRepo });
    } catch (err) {
        console.error('Error forking repo:', err);
        res.status(500).json({ error: `Fork failed: ${err.message}` });
    }
});

module.exports = router;
