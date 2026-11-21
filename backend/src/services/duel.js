// Rules for deciding how a duel stands at a given moment.

// Returns 'in_progress', 'player1_won', 'player2_won', or 'draw'.
function duelDecide({ startTime, durationSeconds, now, player1SolveTime, player2SolveTime }) {
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

    // A solve counts if it landed by the time the timer hit 0, even if we only see it later.
    const player1SolvedInTime = player1SolveTime && player1SolveTime <= endTime;
    const player2SolvedInTime = player2SolveTime && player2SolveTime <= endTime;

    if (player1SolvedInTime && player2SolvedInTime) {
        if (player1SolveTime < player2SolveTime) {
            return 'player1_won';
        }
        if (player2SolveTime < player1SolveTime) {
            return 'player2_won';
        }
        return 'draw'; // same second
    }
    if (player1SolvedInTime) {
        return 'player1_won';
    }
    if (player2SolvedInTime) {
        return 'player2_won';
    }
    if (now >= endTime) {
        return 'draw';
    }
    return 'in_progress';
}

module.exports = { duelDecide };
