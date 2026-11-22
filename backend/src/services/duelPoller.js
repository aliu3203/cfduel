// Checks active duels against Codeforces and works out what should be saved for each one.

const codeforces = require('./codeforces');
const { duelDecide } = require('./duel');

// Asks Codeforces whether either player has solved the duel's problem, and returns the columns
// to update in the duels row, or null if there is nothing to save yet.
// `duel` is a duels row joined with both players' Codeforces handles.
async function checkDuel(duel, now) {
    // One request at a time, to stay under Codeforces' rate limit.
    const player1SolveTime = await codeforces.getFirstAcceptedSubmission(duel.player1_handle, duel.problem_id, duel.started_at);
    const player2SolveTime = await codeforces.getFirstAcceptedSubmission(duel.player2_handle, duel.problem_id, duel.started_at);

    const result = duelDecide({
        startTime: duel.started_at,
        durationSeconds: duel.duration_seconds,
        now,
        player1SolveTime,
        player2SolveTime,
    });
    if (result === null) {
        return null;
    }

    // Only save solves that counted, so a solve after the timer hit 0 isn't mistaken for a real one.
    const endTime = new Date(duel.started_at.getTime() + duel.duration_seconds * 1000);
    return {
        result,
        ended_at: now,
        player1_submission_at: solveThatCounted(player1SolveTime, endTime),
        player2_submission_at: solveThatCounted(player2SolveTime, endTime),
    };
}

// Returns the solve time if it landed by the end of the duel, or null if there was none or it came too late.
function solveThatCounted(solveTime, endTime) {
    if (solveTime && solveTime <= endTime) {
        return solveTime;
    }
    return null;
}

module.exports = { checkDuel };
