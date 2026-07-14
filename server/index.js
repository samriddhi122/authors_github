const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const passport = require('passport');
const session = require('express-session');

// Passport Config
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://authors-github.vercel.app',
    FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', 1);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/repos', require('./routes/repo'));
app.use('/repos/:repoId/commits', require('./routes/commit'));
app.use('/repos/:repoId/branches', require('./routes/branch'));
app.use('/repos/:repoId/pulls', require('./routes/pull'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Database Connection
// Use generic URI if env not set, ideal for local dev
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/writer_platform';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
