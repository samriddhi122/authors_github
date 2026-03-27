const express = require('express');
const router = express.Router({ mergeParams: true });
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const Commit = require('../models/Commit');
const { getGoogleApis, copyDocument, makeFilePublic } = require('../utils/googleDocs');

// Middleware to check authentication
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

// @desc    Get all branches for a repo
// @route   GET /repos/:repoId/branches
router.get('/', ensureAuth, async (req, res) => {
    try {
        const repo = await Repository.findById(req.params.repoId);
        if (!repo) return res.status(404).json({ error: 'Repository not found' });
        if (repo.ownerId.toString() !== req.user._id.toString() && repo.visibility !== 'public') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const branches = await Branch.find({ repoId: req.params.repoId }).sort({ createdAt: 'asc' });
        res.json({ success: true, branches });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving branches' });
    }
});

// @desc    Create a new branch from a commit
// @route   POST /repos/:repoId/branches
router.post('/', ensureAuth, async (req, res) => {
    const { branchName, baseCommitId } = req.body;
    
    if (!branchName || !baseCommitId) {
        return res.status(400).json({ error: 'Branch name and Base Commit ID are required' });
    }

    try {
        const repo = await Repository.findById(req.params.repoId);
        if (!repo || repo.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const baseCommit = await Commit.findById(baseCommitId);
        if (!baseCommit || baseCommit.repoId.toString() !== repo._id.toString()) {
            return res.status(404).json({ error: 'Valid base commit not found' });
        }

        // 1. Ensure branch name is unique in this repo
        const existingBranch = await Branch.findOne({ repoId: repo._id, name: branchName });
        if (existingBranch) {
            return res.status(400).json({ error: 'Branch name already exists' });
        }

        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);

        // 2. We use the Snapshot doc stored in the base commit as the actual raw material to copy!
        // This copies the read-only commit into a fresh        // 3. Make a physical copy of the base Document natively
        const workDocName = `${branchName}_working_doc`;
        const newDocId = await copyDocument(drive, baseCommit.docId, workDocName, repo.driveFolderId);

        // 4. Force public access if repo is public
        if (repo.visibility === 'public') {
            await makeFilePublic(drive, newDocId);
        }

        // 5. Register new branch to databaseMongoDB
        const newBranch = await Branch.create({
            repoId: repo._id,
            name: branchName,
            currentDocId: newDocId,
            headCommitId: baseCommit._id
        });

        res.status(201).json({ success: true, branch: newBranch });

    } catch (err) {
        console.error('Error creating branch:', err);
        res.status(500).json({ error: 'Failed to create branch' });
    }
});

// @desc    Merge source branch into target branch safely mapping documents
// @route   POST /repos/:repoId/branches/merge
router.post('/merge', ensureAuth, async (req, res) => {
    const { sourceBranchId, targetBranchId } = req.body;
    if (!sourceBranchId || !targetBranchId) return res.status(400).json({ error: 'Missing branches' });

    try {
        const repo = await Repository.findById(req.params.repoId);
        if (!repo || repo.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Unauthorized' });

        const source = await Branch.findById(sourceBranchId);
        const target = await Branch.findById(targetBranchId);

        if (!source || !target || source.repoId.toString() !== repo._id.toString() || target.repoId.toString() !== repo._id.toString()) {
            return res.status(404).json({ error: 'Branch not found in this repo' });
        }

        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);

        // Duplicate the source document so the target has its own isolated copy
        const mergedName = `${target.name}_merged_from_${source.name}`;
        const newDocId = await copyDocument(drive, source.currentDocId, mergedName, repo.driveFolderId);

        if (repo.visibility === 'public') {
            await makeFilePublic(drive, newDocId);
        }

        // Update target branch pointer
        const oldTargetDocId = target.currentDocId;
        target.currentDocId = newDocId;
        await target.save();

        // Update repo pointer if target was specifically the actively checked-out branch
        if (repo.currentDocId === oldTargetDocId) {
            repo.currentDocId = newDocId;
            await repo.save();
        }

        // Create a Merge Commit
        const lastTargetCommit = await Commit.findOne({ branchId: target._id }).sort({ createdAt: -1 });
        
        // Save the snapshot of the exact merge moment to Google Drive!
        const snapshotName = `[MERGE COMMIT] ${source.name} -> ${target.name}`;
        const snapshotDocId = await copyDocument(drive, newDocId, snapshotName, repo.driveFolderId);

        const mergeCommit = await Commit.create({
            repoId: repo._id,
            branchId: target._id,
            docId: snapshotDocId,
            message: `Merged branch '${source.name}' into '${target.name}'`,
            parentCommitId: lastTargetCommit ? lastTargetCommit._id : null
        });

        res.json({ success: true, branch: target, commit: mergeCommit });
    } catch (err) {
        console.error('Merge error:', err);
        res.status(500).json({ error: 'Merge failed due to server error' });
    }
});

module.exports = router;
