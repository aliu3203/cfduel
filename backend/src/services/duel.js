// Rules for deciding how a duel stands at a given moment.

// Returns 'in_progress', 'player1_won', 'player2_won', or 'draw'.
function duelDecide({ startTime, durationSeconds, now }) {
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

    if (now >= endTime) {
        return 'draw';
    }
    return 'in_progress';
}

module.exports = { duelDecide };
