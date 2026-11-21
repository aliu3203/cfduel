import express from 'express';
import router from './routes/index.js';

const app = express();

app.use(express.json());


// !!!!! IMPORTANT !!!!!!!!
// This should mount to /api or something similar in the future
app.use('/', router);

export default app;
