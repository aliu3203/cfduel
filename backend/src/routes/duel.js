import { Router } from 'express';
import * as duel from '../controllers/duel.js';

const router = Router();

router.get('/history', duel.history);

export default router;
