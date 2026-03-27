const express = require('express');
const passport = require('passport');
const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
// UPGRADED TO FULL DRIVE SCOPE TO PERMIT CROSS-ACCOUNT CLONING
const SCOPES = ['profile', 'email', 'https://www.googleapis.com/auth/drive'];

router.get('/google', passport.authenticate('google', {
    scope: SCOPES,
    accessType: 'offline', // Required to get a refresh token
    prompt: 'consent'      // Force consent screen to ensure we get a refresh token
}));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect to client dashboard or home
        res.redirect('http://localhost:5173/');
    }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('http://localhost:5173/');
    });
});

// @desc    Get current user
// @route   GET /auth/user
// Note: This matches the client request to check if logged in
router.get('/user', (req, res) => {
    res.send(req.user);
});

const { getGoogleApis } = require('../utils/googleDocs');

// @desc    Test Google Drive API Access
// @route   GET /auth/drive-test
// Note:    This fetches the top 5 files from the user's Google Drive to verify API access
router.get('/drive-test', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'You must be logged in to test Drive API' });
    }

    try {
        const { drive } = getGoogleApis(req.user.accessToken, req.user.refreshToken);
        
        const response = await drive.files.list({
            pageSize: 5,
            fields: 'nextPageToken, files(id, name)',
        });
        
        const files = response.data.files;
        if (files.length) {
            res.json({ success: true, files });
        } else {
            res.json({ success: true, message: 'No files found in Google Drive.' });
        }
    } catch (error) {
        console.error('The API returned an error: ' + error);
        res.status(500).json({ success: false, error: 'Failed to access Google Drive API' });
    }
});

module.exports = router;
