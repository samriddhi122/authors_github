const express = require('express');
const passport = require('passport');
const router = express.Router();

// @desc    Auth with Google
// @route   GET /auth/google
const SCOPES = ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'];

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

module.exports = router;
