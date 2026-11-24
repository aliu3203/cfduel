
import { describe, test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';

import app from '../../src/app.js';
import pool from '../../src/db.js';

const valid = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'correct-horse'
};

const ORIGIN = process.env.FRONTEND_ORIGIN;

const register = (body) =>
    request(app).post('/auth/register')
        .set('Origin', ORIGIN)
        .send(body);

const login = (body, client = request(app)) =>
    client.post('/auth/login')
        .set('Origin', ORIGIN)
        .send(body);

const logout = (client) =>
    client.post('/auth/logout')
        .set('Origin', ORIGIN);

// Build the schema once from the migration, then empty the users table before every test.
before(async () => {
    const { rows } = await pool.query('SELECT current_database() AS db');
    if (!rows[0].db.endsWith('_test')) {
        throw new Error(`refusing to wipe "${rows[0].db}": use a database ending in _test`);
    }
    await pool.query(
        'DROP TABLE IF EXISTS cf_verifications, duels, users'
    );
    const migration = new URL('../../migrations/001_users.sql', import.meta.url);
    await pool.query(fs.readFileSync(migration, 'utf8'));
});

beforeEach(async () => {
    await pool.query('TRUNCATE users RESTART IDENTITY');
    const res = await register(valid);
    assert.equal(res.status, 201);
});
after(() => pool.end());

describe('POST /auth/login', () => {
    test('accepts correct credentials', async () => {
        const res = await login({
            username: 'alice',
            password: 'correct-horse'
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.username, 'alice');
        assert.equal(res.body.rating, 1000);
        assert.equal(res.body.password_hash, undefined);
    });

    test('rejects an incorrect username', async () => {
        const res = await login({
            username: 'bob',
            password: 'correct-horse'
        });

        assert.equal(res.status, 401);
    });

    test('rejects an incorrect password', async () => {
        const res = await login({
            username: 'alice',
            password: 'wrong-password'
        });

        assert.equal(res.status, 401);
    });

    // JWT TESTS
    test('successful login issues a JWT cookie', async () => {
        const res = await login({
            username: 'alice',
            password: 'correct-horse'
        });

        assert.equal(res.status, 200);

        const cookies = res.headers['set-cookie'];
        assert.ok(cookies);
        assert.ok(cookies.some(cookie =>
            cookie.startsWith('token=') &&
            cookie.includes('HttpOnly')
        ));
    });

    test('authenticated user can access /auth/me', async () => {
        const agent = request.agent(app);

        const loginRes = await login({
            username: 'alice',
            password: 'correct-horse'
        }, agent);

        assert.equal(loginRes.status, 200);

        const res = await agent.get('/auth/me');

        assert.equal(res.status, 200);
        assert.equal(res.body.username, 'alice');
        assert.equal(res.body.rating, 1000);
        assert.equal(res.body.cfHandle, null);
        assert.equal(res.body.password_hash, undefined);
    });

    test('unauthenticated user cannot access /auth/me', async () => {
        const res = await request(app).get('/auth/me');

        assert.equal(res.status, 401);
    });

    test('logout removes the authentication cookie', async () => {
        const agent = request.agent(app);

        await login({
            username: 'alice',
            password: 'correct-horse'
        }, agent);

        const beforeLogout = await agent.get('/auth/me');
        assert.equal(beforeLogout.status, 200);

        const logoutRes = await logout(agent);
        assert.equal(logoutRes.status, 200);

        const afterLogout = await agent.get('/auth/me');
        assert.equal(afterLogout.status, 401);

        assert.ok(logoutRes.headers['set-cookie']?.some(cookie =>
            cookie.startsWith('token=') && cookie.includes('Expires=')
        ));
    });

    test('failed login does not authenticate the user', async () => {
        const agent = request.agent(app);

        const loginRes = await login({
            username: 'alice',
            password: 'wrong-password'
        }, agent);

        assert.equal(loginRes.status, 401);
        assert.equal(loginRes.headers['set-cookie'], undefined);

        const res = await agent.get('/auth/me');
        assert.equal(res.status, 401);
    });

    test('rejects requests from an untrusted origin', async () => {
        const res = await request(app)
            .post('/auth/login')
            .set('Origin', 'https://evil.example')
            .send({
                username: 'alice',
                password: 'correct-horse'
            });

        assert.equal(res.status, 403);
    });

});
