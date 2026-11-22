import { Router } from 'express';
const router = Router();
import * as auth from '../controllers/auth.js';
import requireAuth from '../middleware/auth.js';

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', requireAuth, auth.me); // take auth/me requests -> requireAuth first -> auth/me execute (next())
router.post('/logout', auth.logout);

export default router;