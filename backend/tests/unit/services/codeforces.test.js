import { describe, test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { findEarliestSubmission, getEarliestSubmission } from '../../../src/services/codeforces.js';

// Duel start used throughout: 2026-11-20 18:00:00 UTC (= 1795197600 in Unix seconds).
const START = new Date('2026-11-20T18:00:00Z');

// Builds one submission shaped like a real entry from the Codeforces user.status API.
function submission({ contestId = 1850, index = 'A', verdict = 'OK', creationTimeSeconds }) {
    return {
        id: creationTimeSeconds,
        contestId,
        creationTimeSeconds,
        relativeTimeSeconds: 2147483647,
        problem: { contestId, index, name: 'Problem', type: 'PROGRAMMING', tags: [] },
        author: {
            contestId,
            members: [{ handle: 'alice' }],
            participantType: 'PRACTICE',
            ghost: false,
        },
        programmingLanguage: 'C++23 (GCC 14-64, msys2)',
        verdict,
        testset: 'TESTS',
        passedTestCount: 10,
        timeConsumedMillis: 15,
        memoryConsumedBytes: 102400,
    };
}

describe('findEarliestSubmission', () => {
    test('returns the time of an accepted solve made after the start', () => {
        const submissions = [submission({ creationTimeSeconds: 1795197660 })]; // 18:01:00

        const result = findEarliestSubmission(submissions, '1850A', START);

        assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'accepted' });
    });

    test('ignores an accepted solve made before the start', () => {
        const submissions = [submission({ creationTimeSeconds: 1795197540 })]; // 17:59:00

        assert.equal(findEarliestSubmission(submissions, '1850A', START), null);
    });

    test('ignores rejected submissions', () => {
        const submissions = [
            submission({ verdict: 'WRONG_ANSWER', creationTimeSeconds: 1795197660 }),
            submission({ verdict: 'TIME_LIMIT_EXCEEDED', creationTimeSeconds: 1795197720 }),
            submission({ verdict: 'COMPILATION_ERROR', creationTimeSeconds: 1795197780 }),
        ];

        assert.equal(findEarliestSubmission(submissions, '1850A', START), null);
    });

    test('skips a rejected submission and returns the accepted one after it', () => {
        const submissions = [
            submission({ creationTimeSeconds: 1795197720 }), // 18:02:00 accepted
            submission({ verdict: 'WRONG_ANSWER', creationTimeSeconds: 1795197660 }), // 18:01:00
        ];

        const result = findEarliestSubmission(submissions, '1850A', START);

        assert.deepEqual(result, { time: new Date('2026-11-20T18:02:00Z'), status: 'accepted' });
    });

    test('ignores accepted solves of a different problem in the same contest', () => {
        const submissions = [submission({ index: 'B', creationTimeSeconds: 1795197660 })];

        assert.equal(findEarliestSubmission(submissions, '1850A', START), null);
    });

    test('ignores accepted solves of the same letter in a different contest', () => {
        const submissions = [submission({ contestId: 1851, creationTimeSeconds: 1795197660 })];

        assert.equal(findEarliestSubmission(submissions, '1850A', START), null);
    });

    test('returns the earliest accepted solve when there are several', () => {
        // Codeforces lists submissions newest first.
        const submissions = [
            submission({ creationTimeSeconds: 1795197900 }), // 18:05:00
            submission({ creationTimeSeconds: 1795197660 }), // 18:01:00
        ];

        const result = findEarliestSubmission(submissions, '1850A', START);

        assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'accepted' });
    });

    test('counts a solve in the same second the duel started', () => {
        // Codeforces times are whole seconds, but the stored start time can include milliseconds.
        const startWithMillis = new Date('2026-11-20T18:00:00.700Z');
        const submissions = [submission({ creationTimeSeconds: 1795197600 })]; // 18:00:00

        const result = findEarliestSubmission(submissions, '1850A', startWithMillis);

        assert.deepEqual(result, { time: new Date('2026-11-20T18:00:00Z'), status: 'accepted' });
    });

    test('returns null when the user has no submissions', () => {
        assert.equal(findEarliestSubmission([], '1850A', START), null);
    });

    test('handles two-part problem letters like B1', () => {
        const submissions = [submission({ contestId: 1846, index: 'B1', creationTimeSeconds: 1795197660 })];

        const result = findEarliestSubmission(submissions, '1846B1', START);

        assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'accepted' });
    });

    test('throws a clear error for a malformed problem ID', () => {
        for (const badId of ['abc', '1850', 'A1850', '']) {
            assert.throws(
                () => findEarliestSubmission([], badId, START),
                /invalid Codeforces problem ID/i,
                `expected "${badId}" to be rejected`,
            );
        }
    });

    // A submission Codeforces hasn't finished judging might still be accepted, so it counts as 'judging'.
    describe('when a submission is still being judged', () => {
        test('returns a submission marked TESTING as judging', () => {
            const submissions = [submission({ verdict: 'TESTING', creationTimeSeconds: 1795197660 })];

            const result = findEarliestSubmission(submissions, '1850A', START);

            assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'judging' });
        });

        test('returns a submission with no verdict yet as judging', () => {
            // Right after someone submits, Codeforces leaves the verdict out entirely.
            const justSubmitted = submission({ creationTimeSeconds: 1795197660 });
            delete justSubmitted.verdict;

            const result = findEarliestSubmission([justSubmitted], '1850A', START);

            assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'judging' });
        });

        test('returns an earlier submission still being judged over a later accepted one', () => {
            const submissions = [
                submission({ creationTimeSeconds: 1795197900 }), // 18:05:00 accepted
                submission({ verdict: 'TESTING', creationTimeSeconds: 1795197660 }), // 18:01:00
            ];

            const result = findEarliestSubmission(submissions, '1850A', START);

            assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'judging' });
        });
    });
});

// Replaces the global fetch so tests never call the real Codeforces API.
// The fake replies with `body` as JSON, the way Codeforces does.
function fakeCodeforcesReply(body, status = 200) {
    return mock.method(globalThis, 'fetch', async () =>
        new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
    );
}

// Replaces the global fetch with a reply that is an HTML error page instead of JSON,
// which is what Codeforces sends when it is down.
function fakeCodeforcesOutage(status) {
    return mock.method(globalThis, 'fetch', async () =>
        new Response('<html>Codeforces is temporarily unavailable</html>', { status, headers: { 'Content-Type': 'text/html' } }),
    );
}

describe('getEarliestSubmission', () => {
    afterEach(() => mock.restoreAll());

    test("returns the earliest solve from the user's Codeforces submissions", async () => {
        fakeCodeforcesReply({
            status: 'OK',
            result: [
                submission({ creationTimeSeconds: 1795197900 }), // 18:05:00
                submission({ creationTimeSeconds: 1795197660 }), // 18:01:00
            ],
        });

        const result = await getEarliestSubmission('alice', '1850A', START);

        assert.deepEqual(result, { time: new Date('2026-11-20T18:01:00Z'), status: 'accepted' });
    });

    test("asks Codeforces for that user's submissions", async () => {
        const fetchMock = fakeCodeforcesReply({ status: 'OK', result: [] });

        await getEarliestSubmission('alice', '1850A', START);

        assert.equal(fetchMock.mock.callCount(), 1);
        const requestedUrl = new URL(fetchMock.mock.calls[0].arguments[0]);
        assert.equal(requestedUrl.origin + requestedUrl.pathname, 'https://codeforces.com/api/user.status');
        assert.equal(requestedUrl.searchParams.get('handle'), 'alice');
    });

    test('throws with the Codeforces message when the handle does not exist', async () => {
        // The exact reply Codeforces gives for an unknown handle (HTTP 400).
        fakeCodeforcesReply({ status: 'FAILED', comment: 'handle: User with handle nobody not found' }, 400);

        await assert.rejects(
            getEarliestSubmission('nobody', '1850A', START),
            /User with handle nobody not found/,
        );
    });

    test('throws a clear error when Codeforces is down', async () => {
        fakeCodeforcesOutage(503);

        await assert.rejects(
            getEarliestSubmission('alice', '1850A', START),
            /Codeforces .*503/,
        );
    });
});
