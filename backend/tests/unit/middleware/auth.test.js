
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';

process.env.JWT_SECRET ||= 'test-secret-for-jwt-middleware'; // make sure the env variable exists, its needed for JWT

const { default: requireAuth } = await import('../../../src/middleware/auth.js');

// make a dummy protected endpoint in express
const app = express();
app.use(cookieParser());

app.get('/protected', requireAuth, (req, res) => {
    res.status(200).json({ userId: req.user.id });
});

const sign = (payload, options = {}) =>
    jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        ...options
    });

const authenticate = (token) =>
    request(app).get('/protected').set('Cookie', `token=${token}`);

describe('JWT authentication middleware', () => {
    test('rejects missing token', async () => {
        const res = await request(app).get('/protected');

        assert.equal(res.status, 401);
    });

    test('accepts valid token', async () => {
        const token = sign({ userId: '1' });
        const res = await authenticate(token);

        assert.equal(res.status, 200);
        assert.equal(res.body.userId, '1');
    });

    test('rejects invalid signature', async () => {
        const token = jwt.sign(
            { userId: '1' },
            'different-secret'
        );

        const res = await authenticate(token);

        assert.equal(res.status, 401);
    });

    test('rejects expired token', async () => {
        const token = sign(
            { userId: '1' },
            { expiresIn: -1 }
        );

        const res = await authenticate(token);

        assert.equal(res.status, 401);
    });

    test('rejects invalid userId', async () => {
        const token = sign({ userId: 123 });
        const res = await authenticate(token);

        assert.equal(res.status, 401);
    });

    test('rejects unexpected signing algorithm', async () => {
        const token = sign(
            { userId: '1' },
            { algorithm: 'HS384' }
        );

        const res = await authenticate(token);

        assert.equal(res.status, 401);
    });
});
