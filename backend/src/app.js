const express = require('express');
const app = express();

app.use(express.json());

const router = require('./routes');

// !!!!! IMPORTANT !!!!!!!!
// This should mount to /api or something similar in the future
app.use('/', router);

module.exports = app;
