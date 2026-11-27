import { describe, test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import pool from '../../src/db.js';

const ORIGIN = process.env.FRONTEND_ORIGIN;
const PASSWORD = 'test-pass';
let passwordHash;

before(async () => {
    const { rows } = await pool.query('SELECT current_database() AS db');
    if (!rows[0].db.endsWith('_test')) {
        throw new Error('use a database ending with _test');
    }

    await pool.query('DROP TABLE IF EXISTS cf_verifications, duels, users CASCADE');
    for (const file of ['001_users.sql', '002_duels.sql']) {
        const path = new URL(`../../migrations/${file}`, import.meta.url);
        await pool.query(fs.readFileSync(path, 'utf8'));
    }
    passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(async () => {
    await pool.query('TRUNCATE duels, users RESTART IDENTITY CASCADE');

    // dave has an account but never linked a Codeforces handle
    await pool.query(`
        INSERT INTO users (username, email, password_hash, cf_handle)
        VALUES
            ('anna',  'anna@example.com',  $1, 'anna_cf'),
            ('boris', 'boris@example.com', $1, 'boris_cf'),
            ('carol', 'carol@example.com', $1, 'carol_cf'),
            ('dave',  'dave@example.com',  $1, NULL)
    `, [passwordHash]);

    // Closed duels between anna and boris; these must not stop a new challenge.
    await pool.query(`
        INSERT INTO duels (player1_username, player2_username, status, problem_id,
                           result, started_at, ended_at)
        VALUES
            ('anna', 'boris', 'finished', '1843C', 'player1',
             '2026-11-01T18:00:00Z', '2026-11-01T19:00:00Z'),
            ('boris', 'anna', 'cancelled', NULL, NULL, NULL, NULL)
    `);
});

after(() => pool.end());

async function login(username) {
    const client = request.agent(app);
    const res = await client.post('/api/auth/login')
        .set('Origin', ORIGIN)
        .send({ username, password: PASSWORD });
    assert.equal(res.status, 200);
    return client;
}

function challenge(client, body) {
    return client.post('/api/duel').set('Origin', ORIGIN).send(body);
}

async function duelCount() {
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM duels');
    return rows[0].n;
}

describe('POST /duel', () => {

    // Story 3, acceptance criterion 1

    test('creates a pending duel with the challenger as player1', async () => {
        const client = await login('anna');
        const res = await challenge(client, { oppUsername: 'boris' });

        assert.equal(res.status, 201);
        assert.match(res.body.id, /^[1-9]\d*$/);

        const { rows } = await pool.query('SELECT * FROM duels WHERE id = $1', [res.body.id]);
        assert.equal(rows.length, 1);
        const duel = rows[0];
        assert.equal(duel.player1_username, 'anna');
        assert.equal(duel.player2_username, 'boris');
        assert.equal(duel.status, 'pending');
        assert.equal(duel.player1_ready, false);
        assert.equal(duel.player2_ready, false);
        assert.equal(duel.started_at, null);
        assert.equal(duel.result, null);
    });

    test('stores the opponent username as registered, not as typed', async () => {
        const client = await login('anna');
        const res = await challenge(client, { oppUsername: 'BoRiS' });

        assert.equal(res.status, 201);
        const { rows } = await pool.query(
            'SELECT player2_username FROM duels WHERE id = $1', [res.body.id]
        );
        assert.equal(rows[0].player2_username, 'boris');
    });

    // Story 3, acceptance criterion 2

    test('unknown username is an invalid user', async () => {
        const client = await login('anna');
        const countBefore = await duelCount();
        const res = await challenge(client, { oppUsername: 'nobody' });

        assert.equal(res.status, 404);
        assert.equal(res.body.error, 'This is an invalid user');
        assert.equal(await duelCount(), countBefore);
    });

    // Input and precondition errors

    test('cannot challenge yourself, in any letter case', async () => {
        const client = await login('anna');
        const countBefore = await duelCount();
        const res = await challenge(client, { oppUsername: 'Anna' });

        assert.equal(res.status, 400);
        assert.equal(typeof res.body.error, 'string');
        assert.equal(await duelCount(), countBefore);
    });

    test('rejects a missing, empty, or non-string oppUsername', async () => {
        const client = await login('anna');
        const countBefore = await duelCount();

        for (const body of [{}, { oppUsername: '' }, { oppUsername: 42 }, { oppUsername: ['boris'] }]) {
            const res = await challenge(client, body);
            assert.equal(res.status, 400, `body ${JSON.stringify(body)}`);
            assert.equal(typeof res.body.error, 'string');
        }
        assert.equal(await duelCount(), countBefore);
    });

    test('challenger without a linked Codeforces handle is forbidden', async () => {
        const client = await login('dave');
        const countBefore = await duelCount();
        const res = await challenge(client, { oppUsername: 'boris' });

        assert.equal(res.status, 403);
        assert.equal(typeof res.body.error, 'string');
        assert.equal(await duelCount(), countBefore);
    });

    test('opponent without a linked Codeforces handle cannot be challenged', async () => {
        const client = await login('anna');
        const countBefore = await duelCount();
        const res = await challenge(client, { oppUsername: 'dave' });

        assert.equal(res.status, 409);
        assert.equal(typeof res.body.error, 'string');
        assert.equal(await duelCount(), countBefore);
    });

    test('rejects a challenge while a pending or active duel exists between the pair', async () => {
        await pool.query(`
            INSERT INTO duels (player1_username, player2_username, status, started_at)
            VALUES
                ('carol', 'anna',  'pending', NULL),
                ('boris', 'carol', 'active',  '2026-11-27T18:00:00Z')
        `);
        const countBefore = await duelCount();

        const anna = await login('anna');
        const carol = await login('carol');
        const boris = await login('boris');

        const cases = [
            [anna, 'carol'],  // reverse direction of a pending duel
            [carol, 'anna'],  // same direction as a pending duel
            [boris, 'carol'], // same direction as an active duel
            [carol, 'boris'], // reverse direction of an active duel
        ];
        for (const [client, oppUsername] of cases) {
            const res = await challenge(client, { oppUsername });
            assert.equal(res.status, 409, `challenge to ${oppUsername}`);
            assert.equal(typeof res.body.error, 'string');
        }
        assert.equal(await duelCount(), countBefore);
    });

    test('requires login', async () => {
        const countBefore = await duelCount();
        const res = await request(app)
            .post('/api/duel')
            .set('Origin', ORIGIN)
            .send({ oppUsername: 'boris' });

        assert.equal(res.status, 401);
        assert.equal(await duelCount(), countBefore);
    });
});
