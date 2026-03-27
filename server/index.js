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

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Allow your client origin
    credentials: true // Allow cookies to be sent/received
}));

// Sessions
app.use(
    session({
        secret: 'keyboard cat', // Change this in production
        resave: false,
        saveUninitialized: false,
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
