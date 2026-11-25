import { Router } from 'express';
const router = Router();
import * as auth from '../controllers/auth.js';
import requireAuth from '../middleware/auth.js';

// make sure future duel routes require auth, eg
// router.post('/duels', requireAuth, duels.create);