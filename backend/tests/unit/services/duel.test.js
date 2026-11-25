import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { duelDecide } from '../../../src/services/duel.js';

// Every test uses the same duel: it starts at 18:00:00 UTC and lasts 2 hours, so it ends at 20:00:00.
const START = new Date('2026-11-20T18:00:00Z');
const TWO_HOURS_IN_SECONDS = 7200;

// Builds the input for one check of the duel. Times are written as ISO strings to keep tests short.
// `playerNSolved` is when that player's accepted submission was made; `playerNJudging` is when they made
// a submission Codeforces is still judging. A player with neither has no submission (null).
function duelCheck({ now, player1Solved = null, player2Solved = null, player1Judging = null, player2Judging = null }) {
    return {
        startTime: START,
        durationSeconds: TWO_HOURS_IN_SECONDS,
        now: new Date(now),
        player1Submission: acceptedAt(player1Solved) ?? judgingAt(player1Judging),
        player2Submission: acceptedAt(player2Solved) ?? judgingAt(player2Judging),
    };
}

// An accepted submission made at `time` (an ISO string), or null if there is no time.
function acceptedAt(time) {
    return time && { time: new Date(time), status: 'accepted' };
}

// A submission made at `time` that Codeforces is still judging, or null if there is no time.
function judgingAt(time) {
    return time && { time: new Date(time), status: 'judging' };
}

describe('duelDecide', () => {
    describe('when nobody has solved', () => {
        test('is still in progress while time remains', () => {
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T18:30:00Z' })), null);
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T19:59:59Z' })), null); // last second
        });

        test('is a draw once time runs out', () => {
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T20:00:00Z' })), 'draw'); // timer hits 0
            assert.equal(duelDecide(duelCheck({ now: '2026-11-20T20:45:00Z' })), 'draw');
        });
    });

    describe('when one player has solved', () => {
        test('player 1 wins right away, without waiting for time to run out', () => {
            const check = duelCheck({ now: '2026-11-20T18:45:00Z', player1Solved: '2026-11-20T18:40:00Z' });

            assert.equal(duelDecide(check), 'player1');
        });

        test('player 2 wins right away, without waiting for time to run out', () => {
            const check = duelCheck({ now: '2026-11-20T18:45:00Z', player2Solved: '2026-11-20T18:40:00Z' });

            assert.equal(duelDecide(check), 'player2');
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

            assert.equal(duelDecide(check), 'player2');
        });

        test('player 1 wins when they solved first', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Solved: '2026-11-20T18:40:00Z',
                player2Solved: '2026-11-20T18:42:00Z',
            });

            assert.equal(duelDecide(check), 'player1');
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

            assert.equal(duelDecide(check), 'player1');
        });

        test('player 2: a solve in the exact second the timer hits 0 still wins', () => {
            // rule: a solve that lands as time runs out still counts; only later solves don't.
            const check = duelCheck({ now: '2026-11-20T20:00:30Z', player2Solved: '2026-11-20T20:00:00Z' });

            assert.equal(duelDecide(check), 'player2');
        });

        test('player 1: a solve made in time still wins when it is only seen after time ran out', () => {
            // The server polls every so often, so a 19:59:50 solve may first be seen at 20:00:20.
            const check = duelCheck({ now: '2026-11-20T20:00:20Z', player1Solved: '2026-11-20T19:59:50Z' });

            assert.equal(duelDecide(check), 'player1');
        });

        test('player 2: a solve made in time still wins when it is only seen after time ran out', () => {
            // The server polls every so often, so a 19:59:50 solve may first be seen at 20:00:20.
            const check = duelCheck({ now: '2026-11-20T20:00:20Z', player2Solved: '2026-11-20T19:59:50Z' });

            assert.equal(duelDecide(check), 'player2');
        });

        test('the player who solved in time wins when the other solved too late', () => {
            const check = duelCheck({
                now: '2026-11-20T20:15:00Z',
                player1Solved: '2026-11-20T20:10:00Z', // too late
                player2Solved: '2026-11-20T19:30:00Z', // in time
            });

            assert.equal(duelDecide(check), 'player2');
        });
    });

    // A submission still being judged might be accepted, so the duel waits for its verdict
    // whenever it could decide the result.
    describe('when a submission is still being judged', () => {
        test('waits while the only submission is being judged', () => {
            const check = duelCheck({ now: '2026-11-20T18:45:00Z', player1Judging: '2026-11-20T18:40:00Z' });

            assert.equal(duelDecide(check), null);
        });

        test('does not call a draw at the end while a submission made in time is being judged', () => {
            const check = duelCheck({ now: '2026-11-20T20:00:20Z', player2Judging: '2026-11-20T19:59:50Z' });

            assert.equal(duelDecide(check), null);
        });

        test('waits when the earlier submission is being judged, even though the later one is accepted', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Judging: '2026-11-20T18:40:00Z',
                player2Solved: '2026-11-20T18:42:00Z',
            });

            assert.equal(duelDecide(check), null);
        });

        test('the earlier accepted submission wins without waiting for a later one being judged', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Solved: '2026-11-20T18:40:00Z',
                player2Judging: '2026-11-20T18:42:00Z',
            });

            assert.equal(duelDecide(check), 'player1');
        });

        test('waits when both submitted in the same second and one is still being judged', () => {
            const check = duelCheck({
                now: '2026-11-20T18:45:00Z',
                player1Solved: '2026-11-20T18:40:00Z',
                player2Judging: '2026-11-20T18:40:00Z',
            });

            assert.equal(duelDecide(check), null);
        });

        test('ignores a submission made after the timer hit 0, so the duel is still a draw', () => {
            const check = duelCheck({ now: '2026-11-20T20:00:30Z', player1Judging: '2026-11-20T20:00:10Z' });

            assert.equal(duelDecide(check), 'draw');
        });
    });
});
