
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { before, beforeEach, after, afterEach, test } from 'node:test';
import request from 'supertest';

import app from '../../src/app.js';
import pool from '../../src/db.js';

const ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const PASSWORD = 'ExamplePass123!';
const USERNAME = 'test_user_1';
const HANDLE = 'test_user_cfhandle_1';
const EMAIL = 'test_user_1@example.com';
const originalFetch = globalThis.fetch;

before(async () => {
    const { rows } = await pool.query('SELECT current_database() AS name');

    if (!rows[0].name.endsWith('_test')) {
        throw new Error('Refusing to run on a non-test database');
    }

    await pool.query(
        'DROP TABLE IF EXISTS cf_verifications, duels, users CASCADE'
    );

    for (const file of [
        '001_users.sql',
        '002_duels.sql',
        '003_cf_verifications.sql'
    ]) {
        const path = new URL(`../../migrations/${file}`, import.meta.url);
        await pool.query(await fs.readFile(path, 'utf8'));
    }
});

beforeEach(async () => {
    await pool.query(
        'TRUNCATE cf_verifications, duels, users RESTART IDENTITY CASCADE'
    );
});

afterEach(() => {
    globalThis.fetch = originalFetch;
});

after(async () => {
    await pool.end();
});

async function login() {
    const client = request.agent(app);

    const registerResponse = await client.post('/api/auth/register')
        .set('Origin', ORIGIN)
        .send({
            username: USERNAME,
            email: EMAIL,
            password: PASSWORD
        });

    assert.equal(registerResponse.status, 201);

    const loginResponse = await client.post('/api/auth/login')
        .set('Origin', ORIGIN)
        .send({
            username: USERNAME,
            password: PASSWORD
        });

    assert.equal(loginResponse.status, 200);

    return client;
}

function start(client, cfHandle = HANDLE) {
    return client.post('/api/cf/verify/start')
        .set('Origin', ORIGIN)
        .send({ cfHandle });
}

function confirm(client) {
    return client.post('/api/cf/verify/confirm')
        .set('Origin', ORIGIN)
        .send({});
}

// Simulates the Codeforces user.info response.
function mockCodeforces(firstName) {
    globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({
            status: 'OK',
            result: [{
                handle: HANDLE,
                firstName
            }]
        })
    });
}

test('start creates a pending verification', async () => {
    const client = await login();
    const response = await start(client);

    assert.equal(response.status, 200);
    assert.ok(response.body.cfCode);

    const { rows } = await pool.query(
        `SELECT cf_code, cf_handle
         FROM cf_verifications
         WHERE username = $1`,
        [USERNAME]
    );

    assert.equal(rows[0].cf_code, response.body.cfCode);
    assert.equal(rows[0].cf_handle, HANDLE);

    const { rows: users } = await pool.query(
        `SELECT cf_handle
         FROM users
         WHERE username = $1`,
        [USERNAME]
    );

    assert.equal(users[0].cf_handle, null);
});

test('start rejects an empty handle', async () => {
    const client = await login();
    const response = await start(client, '');

    assert.equal(response.status, 400);
});

test('confirm rejects incorrect Codeforces first name', async () => {
    const client = await login();
    await start(client);

    mockCodeforces('WrongName');

    const response = await confirm(client);

    assert.equal(response.status, 400);

    const { rows } = await pool.query(
        `SELECT cf_handle
         FROM users
         WHERE username = $1`,
        [USERNAME]
    );

    assert.equal(rows[0].cf_handle, null);
});

test('confirm links handle and removes pending verification', async () => {
    const client = await login();
    const started = await start(client);

    assert.equal(started.status, 200);

    mockCodeforces(started.body.cfCode);

    const response = await confirm(client);

    assert.equal(response.status, 200);
    assert.equal(response.body.cfHandle, HANDLE);

    const { rows: users } = await pool.query(
        `SELECT cf_handle
         FROM users
         WHERE username = $1`,
        [USERNAME]
    );

    assert.equal(users[0].cf_handle, HANDLE);

    const { rows: pending } = await pool.query(
        `SELECT id
         FROM cf_verifications
         WHERE username = $1`,
        [USERNAME]
    );

    assert.equal(pending.length, 0);
});


for (const status of ['pending', 'active']) {
    test(`confirm rejects handle changes during a ${status} duel`, async () => {
        const client = await login();
        const started = await start(client);

        assert.equal(started.status, 200);

        // Create an opponent.
        await pool.query(
            `INSERT INTO users (username, email, password_hash)
             VALUES ($1, $2, $3)`,
            ['test_user_2', 'test_user_2@example.com', 'placeholder-hash']
        );

        // Active duels require started_at.
        await pool.query(
            `INSERT INTO duels
                (player1_username, player2_username, status, started_at)
             VALUES ($1, $2, $3, $4)`,
            [
                USERNAME,
                'test_user_2',
                status,
                status === 'active' ? new Date() : null
            ]
        );

        mockCodeforces(started.body.cfCode);

        const response = await confirm(client);

        assert.equal(response.status, 409);

        const { rows: users } = await pool.query(
            `SELECT cf_handle FROM users WHERE username = $1`,
            [USERNAME]
        );

        assert.equal(users[0].cf_handle, null);

        // Failed confirmation must preserve the pending challenge.
        const { rows: pending } = await pool.query(
            `SELECT id FROM cf_verifications WHERE username = $1`,
            [USERNAME]
        );

        assert.equal(pending.length, 1);
    });
}