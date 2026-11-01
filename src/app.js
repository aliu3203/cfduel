const express = require('express');
const router = require('./routes');

const app = express();

// !!!!! IMPORTANT !!!!!!!!
// This should mount to /api or something similar in the future
app.use('/', router);

module.exports = app;
