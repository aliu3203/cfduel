const router = require('express').Router();

// implement api routes here, callbacks should go into
// separate folder src/controllers

router.get('/', (req, res) => {
    res.send("Hello World!");
});

module.exports = router;
