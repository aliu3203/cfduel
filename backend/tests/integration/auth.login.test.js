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

const register = (body) =>
    request(app).post('/auth/register').send(body);

const login = (body) =>
    request(app).post('/auth/login').send(body);

// Build the schema once from the migration, then empty the users table before every test.
before(async () => {
    const { rows } = await pool.query('SELECT current_database() AS db');
    if (!rows[0].db.endsWith('_test')) {
        throw new Error(`refusing to wipe "${rows[0].db}": use a database ending in _test`);
    }
    await pool.query('DROP TABLE IF EXISTS users');
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
});