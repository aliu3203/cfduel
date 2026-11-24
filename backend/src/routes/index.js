import { Router } from 'express';
import authRoutes from './auth.js';
import cfRoutes from './cf.js';

const router = Router();

// implement api routes here, callbacks should go into
// separate folder src/controllers

router.use('/auth', authRoutes);
router.use('/cf', cfRoutes);


router.get('/', (req, res) => {
    res.send("Hello World!");
});

export default router;