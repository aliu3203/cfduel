// Checks active duels against Codeforces and works out what should be saved for each one.

import { getEarliestSubmission } from './codeforces.js';
import { duelDecide } from './duel.js';

// Asks Codeforces whether either player has solved the duel's problem, and returns the columns
// to update in the duels row, or null if there is nothing to save yet.
// `duel` is a duels row joined with both players' Codeforces handles.
// `getSubmission` looks up a player's earliest submission; tests pass in a fake so they never call Codeforces.
export async function checkDuel(duel, now, getSubmission = getEarliestSubmission) {
    // One request at a time, to stay under Codeforces' rate limit.
    const player1Submission = await getSubmission(duel.player1_handle, duel.problem_id, duel.started_at);
    const player2Submission = await getSubmission(duel.player2_handle, duel.problem_id, duel.started_at);

    const result = duelDecide({
        startTime: duel.started_at,
        durationSeconds: duel.duration_seconds,
        now,
        player1Submission,
        player2Submission,
    });
    if (result === null) {
        return null;
    }

    // Only save solves that counted, so a solve after the timer hit 0, or a submission that might
    // still be rejected, isn't mistaken for a real one.
    const endTime = new Date(duel.started_at.getTime() + duel.duration_seconds * 1000);
    return {
        result,
        ended_at: now,
        player1_submission_at: solveThatCounted(player1Submission, endTime),
        player2_submission_at: solveThatCounted(player2Submission, endTime),
    };
}

// Returns the submission's time if it was accepted and made by the end of the duel, or null otherwise.
function solveThatCounted(submission, endTime) {
    if (submission?.status === 'accepted' && submission.time <= endTime) {
        return submission.time;
    }
    return null;
}
