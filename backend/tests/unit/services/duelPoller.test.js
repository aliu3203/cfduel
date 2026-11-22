const { describe, test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const codeforces = require('../../../src/services/codeforces');
const { checkDuel } = require('../../../src/services/duelPoller');

// Every test checks the same duel: problem 1850A between alice and bob, from 18:00 to 20:00 UTC.
// It has the shape of a duels row joined with both players' Codeforces handles.
const DUEL = {
    problem_id: '1850A',
    started_at: new Date('2026-11-20T18:00:00Z'),
    duration_seconds: 7200,
    player1_handle: 'alice',
    player2_handle: 'bob',
};

// Replaces getFirstAcceptedSubmission with one that fails for `failingHandle` the way the real one does
// (e.g. when Codeforces is down or rate-limits us) and says nobody else has solved.
function fakeCodeforcesFailure(failingHandle) {
    return mock.method(codeforces, 'getFirstAcceptedSubmission', async (handle) => {
        if (handle === failingHandle) {
            throw new Error('Codeforces API error: Call limit exceeded');
        }
        return null;
    });
}

// Replaces getFirstAcceptedSubmission so tests never call Codeforces (it has its own tests).
// `solveTimes` maps a handle to when that player solved; players left out haven't solved.
function fakeSolves(solveTimes) {
    return mock.method(codeforces, 'getFirstAcceptedSubmission', async (handle) =>
        solveTimes[handle] ? new Date(solveTimes[handle]) : null,
    );
}

describe('checkDuel', () => {
    afterEach(() => mock.restoreAll());

    describe('while the duel is still going', () => {
        test('returns null because there is nothing to save yet', async () => {
            fakeSolves({});

            const update = await checkDuel(DUEL, new Date('2026-11-20T18:30:00Z'));

            assert.equal(update, null);
        });

        test("asks Codeforces about both players, for the duel's problem since it started", async () => {
            const fake = fakeSolves({});

            await checkDuel(DUEL, new Date('2026-11-20T18:30:00Z'));

            const requests = fake.mock.calls.map((call) => call.arguments);
            assert.deepEqual(requests, [
                ['alice', '1850A', new Date('2026-11-20T18:00:00Z')],
                ['bob', '1850A', new Date('2026-11-20T18:00:00Z')],
            ]);
        });
    });

    describe('when a player has solved', () => {
        test('player 1 wins: the duel ends now and their solve time is saved', async () => {
            fakeSolves({ alice: '2026-11-20T18:40:00Z' });

            const update = await checkDuel(DUEL, new Date('2026-11-20T18:40:30Z'));

            assert.deepEqual(update, {
                result: 'player1',
                ended_at: new Date('2026-11-20T18:40:30Z'),
                player1_submission_at: new Date('2026-11-20T18:40:00Z'),
                player2_submission_at: null,
            });
        });

        test('player 2 wins: the duel ends now and their solve time is saved', async () => {
            fakeSolves({ bob: '2026-11-20T18:40:00Z' });

            const update = await checkDuel(DUEL, new Date('2026-11-20T18:40:30Z'));

            assert.deepEqual(update, {
                result: 'player2',
                ended_at: new Date('2026-11-20T18:40:30Z'),
                player1_submission_at: null,
                player2_submission_at: new Date('2026-11-20T18:40:00Z'),
            });
        });

        test('when both solved before we checked, the earlier one wins and both times are saved', async () => {
            fakeSolves({ alice: '2026-11-20T18:42:00Z', bob: '2026-11-20T18:40:00Z' });

            const update = await checkDuel(DUEL, new Date('2026-11-20T18:42:30Z'));

            assert.deepEqual(update, {
                result: 'player2',
                ended_at: new Date('2026-11-20T18:42:30Z'),
                player1_submission_at: new Date('2026-11-20T18:42:00Z'),
                player2_submission_at: new Date('2026-11-20T18:40:00Z'),
            });
        });
    });

    // The duel runs from 18:00 to 20:00, so a solve after 20:00:00 doesn't count.
    describe('when time runs out', () => {
        test('nobody solved: the duel ends as a draw', async () => {
            fakeSolves({});

            const update = await checkDuel(DUEL, new Date('2026-11-20T20:00:30Z'));

            assert.deepEqual(update, {
                result: 'draw',
                ended_at: new Date('2026-11-20T20:00:30Z'),
                player1_submission_at: null,
                player2_submission_at: null,
            });
        });

        test('a solve after the timer hit 0 is a draw and its time is not saved', async () => {
            fakeSolves({ alice: '2026-11-20T20:00:10Z' });

            const update = await checkDuel(DUEL, new Date('2026-11-20T20:00:30Z'));

            assert.deepEqual(update, {
                result: 'draw',
                ended_at: new Date('2026-11-20T20:00:30Z'),
                player1_submission_at: null,
                player2_submission_at: null,
            });
        });

        test('the player who solved in time wins, and the late solve is not saved', async () => {
            fakeSolves({ alice: '2026-11-20T20:00:10Z', bob: '2026-11-20T19:59:50Z' });

            const update = await checkDuel(DUEL, new Date('2026-11-20T20:00:30Z'));

            assert.deepEqual(update, {
                result: 'player2',
                ended_at: new Date('2026-11-20T20:00:30Z'),
                player1_submission_at: null,
                player2_submission_at: new Date('2026-11-20T19:59:50Z'),
            });
        });
    });

    // If we can't reach Codeforces we don't know who solved, so checkDuel must not guess a result.
    // It fails instead, and the duel is checked again on the next poll.
    describe('when Codeforces fails', () => {
        test('fails with the Codeforces error', async () => {
            fakeCodeforcesFailure('bob');

            await assert.rejects(
                checkDuel(DUEL, new Date('2026-11-20T18:30:00Z')),
                /Call limit exceeded/,
            );
        });

        test('does not call a draw after time runs out, since a player may have solved in time', async () => {
            fakeCodeforcesFailure('alice');

            await assert.rejects(checkDuel(DUEL, new Date('2026-11-20T20:00:30Z')));
        });

        test("stops after the first failure instead of also asking about the other player", async () => {
            const fake = fakeCodeforcesFailure('alice');

            await assert.rejects(checkDuel(DUEL, new Date('2026-11-20T18:30:00Z')));

            assert.equal(fake.mock.callCount(), 1);
        });
    });
});
