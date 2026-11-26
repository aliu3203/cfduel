// Rules for deciding how a duel stands at a given moment.

// Returns the winner ('player1' or 'player2'), 'draw', or null while the duel is still going.
// These match the values stored in the duels table's result column.
// Each player's submission is their earliest one that wasn't rejected, as { time, status }, or null.
// A submission still being judged might be accepted, so it makes the duel wait for its verdict.
export function duelDecide({ startTime, durationSeconds, now, player1Submission, player2Submission }) {
    const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
    const player1SubmitTime = player1Submission?.time;
    const player2SubmitTime = player2Submission?.time;

    // A submission counts if it was made by the time the timer hit 0, even if we only see it later.
    const player1SubmittedInTime = player1SubmitTime && player1SubmitTime <= endTime;
    const player2SubmittedInTime = player2SubmitTime && player2SubmitTime <= endTime;

    if (player1SubmittedInTime && player2SubmittedInTime) {
        if (player1SubmitTime < player2SubmitTime) {
            return winsIfAccepted('player1', player1Submission);
        }
        if (player2SubmitTime < player1SubmitTime) {
            return winsIfAccepted('player2', player2Submission);
        }
        // Same second: a draw once both are accepted.
        const bothAccepted = player1Submission.status === 'accepted' && player2Submission.status === 'accepted';
        return bothAccepted ? 'draw' : null;
    }
    if (player1SubmittedInTime) {
        return winsIfAccepted('player1', player1Submission);
    }
    if (player2SubmittedInTime) {
        return winsIfAccepted('player2', player2Submission);
    }
    if (now >= endTime) {
        return 'draw';
    }
    return null; // still going
}

// The player wins if their submission is accepted; if it is still being judged, wait (null).
function winsIfAccepted(player, submission) {
    return submission.status === 'accepted' ? player : null;
}
