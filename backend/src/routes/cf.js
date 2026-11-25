import { Router } from 'express';
import * as cf from '../controllers/cf.js';
import requireAuth from '../middleware/auth.js';
const router = Router();

// CAVEATS: 
// There is exactly one user for exactly one handle (1:1)
router.post('/verify/start', requireAuth, cf.start);
router.post('/verify/confirm', requireAuth, cf.confirm);

export default router;
