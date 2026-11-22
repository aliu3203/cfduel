import { Router } from 'express';
const router = Router();
import * as auth from '../controllers/auth.js';

router.post('/register', auth.register);
router.post('/login', auth.login);

export default router;