const express = require('express');
const cors = require('cors');
const app = express();

// Handle cors immediately
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

const router = require('./routes');

// !!!!! IMPORTANT !!!!!!!!
// This should mount to /api or something similar in the future
app.use('/', router);

module.exports = app;
