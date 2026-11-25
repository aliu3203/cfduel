import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requireTrustedOrigin from './middleware/csrf.js';
import router from './routes/index.js';
const app = express();

// Handle cors immediately
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
}));
app.use(requireTrustedOrigin);
app.use(cookieParser());
app.use(express.json());



// !!!!! IMPORTANT !!!!!!!!
// This should mount to /api or something similar in the future
app.use('/api', router);

export default app;
