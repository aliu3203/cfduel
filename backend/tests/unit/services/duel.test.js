const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { duelDecide } = require('../../../src/services/duel');

// Every test uses the same duel: it starts at 18:00:00 UTC and lasts 2 hours, so it ends at 20:00:00.
const START = new Date('2026-11-20T18:00:00Z');
const TWO_HOURS_IN_SECONDS = 7200;

// Builds the input for one check of the duel. Times are written as ISO strings to keep tests short;
// a player who hasn't solved is left out (null).
function duelCheck({ now, player1Solved = null, player2Solved = null }) {
    return {
        startTime: START,
        durationSeconds: TWO_HOURS_IN_SECONDS,
        now: new Date(now),
        player1SolveTime: player1Solved && new Date(player1Solved),
        player2SolveTime: player2Solved && new Date(player2Solved),
    };
}

describe('duelDecide', () => {
    describe('when nobody has solved', () => {
        test('is still in progress while time remains', () => {
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T18:30:00Z' })), 'in_progress');
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T19:59:59Z' })), 'in_progress'); // last second
        });

        test('is a draw once time runs out', () => {
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T20:00:00Z' })), 'draw'); // timer hits 0
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T20:45:00Z' })), 'draw');
        });
    });
});
