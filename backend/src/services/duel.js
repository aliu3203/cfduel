// Rules for deciding how a duel stands at a given moment.

// Returns the winner ('player1' or 'player2'), 'draw', or null while the duel is still going.
// These match the values stored in the duels table's result column.
export function duelDecide({ startTime, durationSeconds, now, player1SolveTime, player2SolveTime }) {
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

    // A solve counts if it landed by the time the timer hit 0, even if we only see it later.
    const player1SolvedInTime = player1SolveTime && player1SolveTime <= endTime;
    const player2SolvedInTime = player2SolveTime && player2SolveTime <= endTime;

    if (player1SolvedInTime && player2SolvedInTime) {
        if (player1SolveTime < player2SolveTime) {
            return 'player1';
        }
        if (player2SolveTime < player1SolveTime) {
            return 'player2';
        }
        return 'draw'; // same second
    }
    if (player1SolvedInTime) {
        return 'player1';
    }
    if (player2SolvedInTime) {
        return 'player2';
    }
    if (now >= endTime) {
        return 'draw';
    }
    return null; // still going
}
