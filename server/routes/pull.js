const express = require('express');
const router = express.Router({ mergeParams: true });
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const Commit = require('../models/Commit');
const PullRequest = require('../models/PullRequest');
const { getGoogleApis, copyDocument, grantUserReadAccess } = require('../utils/googleDocs');

// Middleware to check authentication
const ensureAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
};

// @desc    Create a Pull Request
// @route   POST /repos/:repoId/pulls
router.post('/', ensureAuth, async (req, res) => {
    const targetRepoId = req.params.repoId;
    const { sourceRepoId, sourceBranchId, targetBranchId, title, description } = req.body;

    try {
        const targetRepo = await Repository.findById(targetRepoId);
        const sourceRepo = await Repository.findById(sourceRepoId);

        if (!targetRepo || !sourceRepo) return res.status(404).json({ error: 'Repository not found' });
        if (sourceRepo.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'You do not own the source repository' });

        let finalTargetBranchId = targetBranchId;
        if (!finalTargetBranchId) {
            const targetMain = await Branch.findOne({ repoId: targetRepoId, name: 'main' });
            if (!targetMain) return res.status(404).json({ error: 'Target main branch missing' });
            finalTargetBranchId = targetMain._id;
        }

        const pr = await PullRequest.create({
            title,
            description,
            sourceRepoId,
            targetRepoId,
            sourceBranchId,
            targetBranchId: finalTargetBranchId
        });

        res.status(201).json({ success: true, pullRequest: pr });
    } catch (err) {
        console.error('Error creating PR:', err);
        res.status(500).json({ error: 'Failed to create PR' });
    }
});

// @desc    Get PRs for a repo
// @route   GET /repos/:repoId/pulls
router.get('/', ensureAuth, async (req, res) => {
    try {
        // Find PRs where this repo is the target OR the source
        const targetPrs = await PullRequest.find({ targetRepoId: req.params.repoId })
            .populate('sourceRepoId', 'name ownerId')
            .populate('sourceBranchId', 'name')
            .populate('targetBranchId', 'name')
            .sort({ createdAt: -1 });

        const sourcePrs = await PullRequest.find({ sourceRepoId: req.params.repoId })
            .populate('targetRepoId', 'name ownerId')
            .populate('sourceBranchId', 'name')
            .populate('targetBranchId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, incoming: targetPrs, outgoing: sourcePrs });
    } catch (err) {
        console.error('Error fetching PRs:', err);
        res.status(500).json({ error: 'Failed to fetch PRs' });
    }
});

// @desc    Merge a Pull Request securely
// @route   PUT /repos/:repoId/pulls/:pullId/merge
router.put('/:pullId/merge', ensureAuth, async (req, res) => {
    try {
        const pr = await PullRequest.findById(req.params.pullId);
        if (!pr || pr.status !== 'open') return res.status(400).json({ error: 'PR not open or not found' });

        const targetRepo = await Repository.findById(pr.targetRepoId);
        if (targetRepo.ownerId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Only the target owner can merge this PR' });

        const sourceBranch = await Branch.findById(pr.sourceBranchId);
        const targetBranch = await Branch.findById(pr.targetBranchId);

        if (!sourceBranch || !targetBranch) return res.status(404).json({ error: 'Branches not found' });

        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);

        // EXPLICIT GRANT OVERRIDE: Sender's tokens silently give Target author (req.user) permission to read their submitted branch document!
        const sourceRepo = await Repository.findById(pr.sourceRepoId).populate('ownerId');
        await grantUserReadAccess(
            sourceRepo.ownerId.accessToken,
            sourceRepo.ownerId.refreshToken,
            sourceBranch.currentDocId,
            req.user.email
        );

        // DELAY: Pause Node execution to allow global Google Drive APIs to physically register the Whitelist Grant!
        await new Promise(resolve => setTimeout(resolve, 2500));

        // 1. Physically extract the Document from the Source Branch Drive, and inject it securely into the Target Repo Drive Folder
        const mergedName = `${targetBranch.name}_merged_pr_${pr._id}`;
        const newDocId = await copyDocument(drive, sourceBranch.currentDocId, mergedName, targetRepo.driveFolderId);

        // 2. Fast-forward pointer updates
        const oldTargetDocId = targetBranch.currentDocId;
        targetBranch.currentDocId = newDocId;
        await targetBranch.save();

        if (targetRepo.currentDocId === oldTargetDocId) {
            targetRepo.currentDocId = newDocId;
            await targetRepo.save();
        }

        // 3. Immediately capture a Merge Commit natively mapping the exact closure point
        const snapshotName = `[PR MERGED] ${pr.title}`;
        const snapshotDocId = await copyDocument(drive, newDocId, snapshotName, targetRepo.driveFolderId);

        const lastTargetCommit = await Commit.findOne({ branchId: targetBranch._id }).sort({ createdAt: -1 });
        await Commit.create({
            repoId: targetRepo._id,
            branchId: targetBranch._id,
            docId: snapshotDocId,
            message: `Merge Pull Request: ${pr.title}`,
            parentCommitId: lastTargetCommit ? lastTargetCommit._id : null
        });

        // 4. Mark PR securely as merged
        pr.status = 'merged';
        await pr.save();

        res.json({ success: true, pullRequest: pr });
    } catch (err) {
        console.error('Error merging PR:', err);
        res.status(500).json({ error: 'Failed to merge PR natively' });
    }
});

module.exports = router;
