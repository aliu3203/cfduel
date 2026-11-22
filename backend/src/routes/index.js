import { Router } from 'express';
import authRoutes from './auth.js';
import duelRoutes from './duel.js';

const router = Router();

// implement api routes here, callbacks should go into
// separate folder src/controllers

router.use('/auth', authRoutes);
router.use('/duel', duelRoutes);

router.get('/', (req, res) => {
    res.send("Hello World!");
});

export default router;
