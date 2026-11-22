import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

// Handle cors immediately
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

import router from './routes/index.js';

// !!!!! IMPORTANT !!!!!!!!
// This should mount to /api or something similar in the future
app.use('/', router);

export default app;