import { Router } from 'express';
const router = Router();

import authRoutes from './auth.js';

// implement api routes here, callbacks should go into
// separate folder src/controllers

router.use('/auth', authRoutes);

router.get('/', (req, res) => {
    res.send("Hello World!");
});

export default router;