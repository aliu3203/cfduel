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

    describe('when one player has solved', () => {
        test('player 1 wins right away, without waiting for time to run out', () => {
            const check = duelCheck({ now: '2026-11-20T18:45:00Z', player1Solved: '2026-11-20T18:40:00Z' });

            assert.equal(duelDecide(check), 'player1_won');
        });

        test('player 2 wins right away, without waiting for time to run out', () => {
            const check = duelCheck({ now: '2026-11-20T18:45:00Z', player2Solved: '2026-11-20T18:40:00Z' });

            assert.equal(duelDecide(check), 'player2_won');
        });
    });

    describe('when both players have solved', () => {
        // Both solves can show up in the same poll, so the earlier solve time decides it.
        test('player 2 wins when they solved first', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Solved: '2026-11-20T18:42:00Z',
                player2Solved: '2026-11-20T18:40:00Z',
            });

            assert.equal(duelDecide(check), 'player2_won');
        });

        test('player 1 wins when they solved first', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Solved: '2026-11-20T18:40:00Z',
                player2Solved: '2026-11-20T18:42:00Z',
            });

            assert.equal(duelDecide(check), 'player1_won');
        });

        test('is a draw when both solved in the same second', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Solved: '2026-11-20T18:40:00Z',
                player2Solved: '2026-11-20T18:40:00Z',
            });

            assert.equal(duelDecide(check), 'draw');
        });
    });

    describe('when time runs out', () => {
        test('player 1: a solve after the timer hit 0 does not count', () => {
            const check = duelCheck({ now: '2026-11-20T20:15:00Z', player1Solved: '2026-11-20T20:10:00Z' });

            assert.equal(duelDecide(check), 'draw');
        });

        test('player 2: a solve after the timer hit 0 does not count', () => {
            const check = duelCheck({ now: '2026-11-20T20:15:00Z', player2Solved: '2026-11-20T20:10:00Z' });

            assert.equal(duelDecide(check), 'draw');
        });

        test('player 1: a solve in the exact second the timer hits 0 still wins', () => {
            // rule: a solve that lands as time runs out still counts; only later solves don't.
            const check = duelCheck({ now: '2026-11-20T20:00:30Z', player1Solved: '2026-11-20T20:00:00Z' });

            assert.equal(duelDecide(check), 'player1_won');
        });

        test('player 2: a solve in the exact second the timer hits 0 still wins', () => {
            // rule: a solve that lands as time runs out still counts; only later solves don't.
            const check = duelCheck({ now: '2026-11-20T20:00:30Z', player2Solved: '2026-11-20T20:00:00Z' });

            assert.equal(duelDecide(check), 'player2_won');
        });

        test('player 1: a solve made in time still wins when it is only seen after time ran out', () => {
            // The server polls every so often, so a 19:59:50 solve may first be seen at 20:00:20.
            const check = duelCheck({ now: '2026-11-20T20:00:20Z', player1Solved: '2026-11-20T19:59:50Z' });

            assert.equal(duelDecide(check), 'player1_won');
        });

        test('player 2: a solve made in time still wins when it is only seen after time ran out', () => {
            // The server polls every so often, so a 19:59:50 solve may first be seen at 20:00:20.
            const check = duelCheck({ now: '2026-11-20T20:00:20Z', player2Solved: '2026-11-20T19:59:50Z' });

            assert.equal(duelDecide(check), 'player2_won');
        });

        test('the player who solved in time wins when the other solved too late', () => {
            const check = duelCheck({
                now: '2026-11-20T20:15:00Z',
                player1Solved: '2026-11-20T20:10:00Z', // too late
                player2Solved: '2026-11-20T19:30:00Z', // in time
            });

            assert.equal(duelDecide(check), 'player2_won');
        });
    });
});
