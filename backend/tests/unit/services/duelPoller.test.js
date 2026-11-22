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
});
