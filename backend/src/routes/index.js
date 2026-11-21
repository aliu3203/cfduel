const router = require('express').Router();

const authRoutes = require('./auth');
const duelRoutes = require('./duel')

// implement api routes here, callbacks should go into
// separate folder src/controllers

router.use('/auth', authRoutes);
router.use('/duel',duelRoutes);

router.get('/', (req, res) => {
    res.send("Hello World!");
});

module.exports = router;
