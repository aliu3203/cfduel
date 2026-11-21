// Rules for deciding how a duel stands at a given moment.

// Returns 'in_progress', 'player1_won', 'player2_won', or 'draw'.
function duelDecide({ startTime, durationSeconds, now, player1SolveTime, player2SolveTime }) {
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

    if (player1SolveTime && player2SolveTime) {
        if (player1SolveTime < player2SolveTime) {
            return 'player1_won';
        }
        if (player2SolveTime < player1SolveTime) {
            return 'player2_won';
        }
        return 'draw'; // same second
    }
    if (player1SolveTime) {
        return 'player1_won';
    }
    if (player2SolveTime) {
        return 'player2_won';
    }
    if (now >= endTime) {
        return 'draw';
    }
    return 'in_progress';
}

module.exports = { duelDecide };
