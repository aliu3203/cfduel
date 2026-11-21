// Talks to the Codeforces API to find out when a user solved a duel problem.

const PROBLEM_ID_RE = /^(?<contestId>\d+)(?<index>[A-Z]\d*)$/;

// Splits a problem ID like "1850A" into its contest number and problem letter.
function parseProblemId(problemId) {
    const match = PROBLEM_ID_RE.exec(problemId);
    if (!match) {
        throw new Error(`invalid Codeforces problem ID: "${problemId}"`);
    }
    return { contestId: Number(match.groups.contestId), index: match.groups.index };
}

// Returns when the user first solved the problem at or after startTime, or null if they haven't.
// Codeforces records times in whole seconds, so a solve in the same second as the start counts.
function findFirstAcceptedSubmission(submissions, problemId, startTime) {
    const problem = parseProblemId(problemId);
    const startSeconds = Math.floor(startTime.getTime() / 1000);

    const solveTimes = submissions
        .filter((submission) =>
            submission.verdict === 'OK'
            && submission.problem.contestId === problem.contestId
            && submission.problem.index === problem.index
            && submission.creationTimeSeconds >= startSeconds
        )
        .map((submission) => submission.creationTimeSeconds);

    if (solveTimes.length === 0) {
        return null;
    }
    return new Date(Math.min(...solveTimes) * 1000);
}

module.exports = { findFirstAcceptedSubmission };
