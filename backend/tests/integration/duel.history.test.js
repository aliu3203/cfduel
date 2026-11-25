import { describe, test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/db.js';
import bcrypt from 'bcrypt';
let passwordHash;

before(async () => {
    const { rows } = await pool.query('SELECT current_database() AS db');

    if (!rows[0].db.endsWith('_test')) {throw new Error('use a database ending with _test');}
    //drop dependencies
    await pool.query('DROP TABLE IF EXISTS cf_verifications, duels, users CASCADE');

    // apply user before duel
    const usersMigration = new URL('../../migrations/001_users.sql',import.meta.url);
    await pool.query(fs.readFileSync(usersMigration, 'utf8'));
    const duelsMigration = new URL('../../migrations/002_duels.sql',import.meta.url);
    await pool.query(fs.readFileSync(duelsMigration, 'utf8'));
    passwordHash = await bcrypt.hash("test-pass", 4);
});

beforeEach(async () => {
    // cleanup before each test
    await pool.query('TRUNCATE duels, users RESTART IDENTITY');
    // insert test users
    await pool.query(`
        INSERT INTO users (username,email,password_hash,cf_handle)
        VALUES
            ('anna',anna@gmail.com',$1,'ann_cf'),
            ('boris','borisj@gmail.com',$1,'boris_cf'),
            ('nathan','natkc@gmail.com',$1,'nat_cf'),
            ('wilson','wilsonlosiento@gmail.com',$1,'wilsonls_cf'),
            ('thomas','ttt@gmail.com',$1,'thomas_cf'),
            ('saoirse','sersha@gmail.com',$1,'sao_cf'),
            ('saul','bettercallsaul@gmail.com',$1,'saul_cf'),
            ('major','majormajormajor@gmail.com',$1,'major_cf'),
            ('sheldon','pennypennypenny@gmail.com',$1,'sheldon_cf'),
            ('lana','cinnamongirl@gmail.com',$1,'lana_cf')
    `,[passwordHash]);
    
    //insert duels
    await pool.query(`
        INSERT INTO duels 
            (player1_username, player2_username, status,
            problem_id, result, started_at, ended_at)
        VALUES
            ('anna', 'boris', 'finished', '1843C', 'player1',
            '2026-11-01T18:00:00Z', '2026-11-01T19:00:00Z'),

            ('boris', 'anna', 'finished', '1843D', 'player2',
            '2026-11-03T18:00:00Z', '2026-11-03T19:00:00Z'),

            ('anna', 'nathan', 'finished', '1843C', 'player2',
            '2026-11-05T18:00:00Z', '2026-11-05T19:00:00Z'),

            ('wilson', 'anna', 'finished', '1844A', 'draw',
            '2026-11-07T18:00:00Z', '2026-11-07T19:00:00Z'),

            ('anna', 'thomas', 'finished', '1845B', 'player1',
            '2026-11-10T18:00:00Z', '2026-11-10T19:00:00Z'),

            ('boris', 'nathan', 'finished', '1843C', 'player1',
            '2026-11-11T18:00:00Z', '2026-11-11T19:00:00Z'),

            ('saoirse', 'anna', 'finished', '1850A', 'player2',
            '2026-11-12T18:00:00Z', '2026-11-12T19:00:00Z'),

            ('anna', 'boris', 'finished', '1843C', 'player2',
            '2026-11-17T18:00:00Z', '2026-11-17T19:00:00Z'),

            ('major', 'anna', 'finished', '1852B', 'player1',
            '2026-11-19T18:00:00Z', '2026-11-19T19:00:00Z'),

            ('nathan', 'sheldon', 'finished', '1843C', 'player1',
            '2026-10-25T18:00:00Z', '2026-10-25T19:00:00Z'),

            ('anna', 'saul', 'active', '1856A', NULL,
            '2026-11-24T15:00:00Z', NULL),

            ('boris', 'wilson', 'active', '1856B', NULL,
            '2026-11-24T14:00:00Z', NULL),

            ('anna', 'sheldon', 'pending', '1857A', NULL,
            NULL, NULL),

            ('wilson', 'saoirse', 'pending', '1857C', NULL,
            NULL, NULL),

            ('boris', 'major', 'cancelled', '1858A', NULL,
            NULL, NULL)
    `);
});

after(() => pool.end());

async function login(username) {
    const client = request.agent(app);

    const response = await client.post('/auth/login')
        .set('Origin', process.env.FRONTEND_ORIGIN)
        .send({
            username: username,
            password: 'test-pass'
        });
    assert.equal(response.status, 200);
    return client;
}

describe('GET /duel/history', () => {

    //acceptance criterion A, player that has never played a game

    test('player that hasnt played', async () => {
        const client = await login('lana');
        const res = await client.get('/duel/history');

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,false);
        assert.deepEqual(res.body.duels,[]);
    });

    test('player that hasnt played but with a search filter', async () => {
        const client = await login('lana');
        const res = await client.get('/duel/history').query({oppHandle: 'wilsonls_cf'});

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,false);
        assert.deepEqual(res.body.duels,[]);
    });

    test('player that hasnt played but with search filters', async () => {
        const client = await login('saul');
        const res = await client.get('/duel/history').query({oppHandle: 'nat_cf',problemNum: '1843C'});

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,false);
        assert.deepEqual(res.body.duels,[]);
    });

    test('player that has played, only duels that have finished', async () => {
        const client = await login('anna');
        const res = await client.get('/duel/history');

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,true);
        assert.equal(res.body.duels.length, 8);
    });

    test('player that has played, only duels that have finished', async () => {
        const client = await login('boris');
        const res = await client.get('/duel/history');

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,true);
        assert.equal(res.body.duels.length, 4);
    });

    //acceptance criterion B, search based on opponent handle

    test('anna searches for boris, descending order', async () => {
        const client = await login('anna');
        const res = await client.get('/duel/history').query({oppHandle: 'boris_cf'});

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,true);
        assert.equal(res.body.duels.length, 3);
        assert.notEqual(res.body.duels.length, 5);
        assert.deepEqual(res.body.duels.map(duel => Number(duel.id)),[8,2,1]);
    });

    test('boris searches for anna, reverse search', async () => {
        const client = await login('boris');
        const res = await client.get('/duel/history').query({oppHandle: 'ann_cf'});

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,true);
        assert.equal(res.body.duels.length, 3);
        assert.notEqual(res.body.duels.length, 5);
        assert.deepEqual(res.body.duels.map(duel => Number(duel.id)),[8,2,1]);
    });

    test('sheldon searches for nathan, single instance', async () => {
        const client = await login('sheldon');
        const res = await client.get('/duel/history').query({oppHandle: 'nat_cf'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 1);
        assert.notEqual(res.body.duels.length, 2);
        assert.deepEqual(res.body.duels.map(duel => Number(duel.id)),[10]);
    });

    test('saoirse searches for wilson, active match', async () => {
        const client = await login('saoirse');
        const res = await client.get('/duel/history').query({oppHandle: 'wilson_cf'});

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,true);
        assert.equal(res.body.duels.length, 0);
        assert.deepEqual(res.body.duels,[]);
    });

    test('major searches for anna, case insensitive', async () => {
        const client = await login('major');
        const res = await client.get('/duel/history').query({oppHandle: 'aNN_Cf'});

        assert.equal(res.status,200);
        assert.equal(res.body.playedBefore,true);
        assert.equal(res.body.duels.length, 1);
        assert.deepEqual(res.body.duels,[9]);
    });

    //acceptance criterion C, search based on problem num.

    test('anna, problem 1843C', async () => {
        const client = await login('anna');
        const res = await client.get('/duel/history').query({problemNum: '1843C'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 3);
        assert.deepEqual(res.body.duels,[8,3,1]);
    });

    test('nathan, problem 1843C, order', async () => {
        const client = await login('nathan');
        const res = await client.get('/duel/history').query({problemNum: '1843C'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 3);
        assert.deepEqual(res.body.duels,[6,3,10]);
    });

    test('wilson, problem 1844A, draw', async () => {
        const client = await login('wilson');
        const res = await client.get('/duel/history').query({problemNum: '1844A'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 1);
        assert.deepEqual(res.body.duels,[4]);
    });

    test('saoirse, problem 1850A, lost', async () => {
        const client = await login('saoirse');
        const res = await client.get('/duel/history').query({problemNum: '1850A'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 1);
        assert.deepEqual(res.body.duels,[7]);
    });

    test('boris, problem 1858A, cancelled', async () => {
        const client = await login('boris');
        const res = await client.get('/duel/history').query({problemNum: '1858A'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 0);
        assert.deepEqual(res.body.duels,[]);
    });

    test('sheldon, problem 1857A, pending', async () => {
        const client = await login('sheldon');
        const res = await client.get('/duel/history').query({problemNum: '1857A'});

        assert.equal(res.status,200);
        assert.equal(res.body.duels.length, 0);
        assert.deepEqual(res.body.duels,[]);
    });

    //acceptance criterion D, duels played within a date range

    



});
