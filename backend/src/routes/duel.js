import { Router } from 'express';
import * as duel from '../controllers/duel.js';
import requireAuth from '../middleware/auth.js';


const router = Router();

router.get('/history', requireAuth, duel.history);

router.post('/', requireAuth, duel.create);

export default router;
