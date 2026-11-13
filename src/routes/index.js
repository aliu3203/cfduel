const router = require('express').Router();

const authRoutes = require('./auth');

// implement api routes here, callbacks should go into
// separate folder src/controllers

router.use('/auth', authRoutes);

router.get('/', (req, res) => {
    res.send("Hello World!");
});

module.exports = router;
