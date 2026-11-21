const router = require('express').Router();
const duel = require('../controllers/duel');

router.get('/history', duel.history);

module.exports = router;