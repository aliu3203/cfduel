import { describe, test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';

import app from '../../src/app.js';
import pool from '../../src/db.js';

const valid = { username: 'alice', email: 'alice@example.com', password: 'correct-horse' };
const register = (body) =>
    request(app).post('/auth/register')
        .set('Origin', 'http://localhost:5173')
        .send(body);

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
beforeEach(() => pool.query('TRUNCATE users RESTART IDENTITY'));
after(() => pool.end());

describe('POST /auth/register', () => {
    test('creates a user and returns 201 with the public fields', async () => {
        const res = await register(valid);

        assert.equal(res.status, 201);
        assert.equal(res.body.username, 'alice');
        assert.equal(res.body.email, 'alice@example.com');
        assert.equal(res.body.rating, 1000);
        assert.equal(res.body.password_hash, undefined);
    });

    test('stores a hash, not the plain password', async () => {
        await register(valid);

        const { rows } = await pool.query('SELECT password_hash FROM users');
        assert.notEqual(rows[0].password_hash, valid.password);
    });

    test('rejects invalid input with 400', async () => {
        const res = await register({ ...valid, username: 'ab' });

        assert.equal(res.status, 400);
        assert.equal(typeof res.body.error, 'string');
    });

    test('rejects a duplicate username with 409', async () => {
        await register(valid);
        const res = await register({ ...valid, email: 'other@example.com' });

        assert.equal(res.status, 409);
    });

    test('rejects a duplicate email in different case with 409', async () => {
        await register(valid);
        const res = await register({ ...valid, username: 'bob', email: 'ALICE@example.com' });

        assert.equal(res.status, 409);
    });
});