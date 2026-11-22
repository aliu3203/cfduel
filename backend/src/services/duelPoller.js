// Checks active duels against Codeforces and works out what should be saved for each one.

const codeforces = require('./codeforces');

// Asks Codeforces whether either player has solved the duel's problem, and returns the columns
// to update in the duels row, or null if there is nothing to save yet.
// `duel` is a duels row joined with both players' Codeforces handles.
async function checkDuel(duel, now) {
    // One request at a time, to stay under Codeforces' rate limit.
    await codeforces.getFirstAcceptedSubmission(duel.player1_handle, duel.problem_id, duel.started_at);
    await codeforces.getFirstAcceptedSubmission(duel.player2_handle, duel.problem_id, duel.started_at);

    return null;
}

module.exports = { checkDuel };
