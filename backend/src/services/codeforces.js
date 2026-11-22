// Talks to the Codeforces API to find out when a user solved a duel problem.

const PROBLEM_ID_RE = /^(?<contestId>\d+)(?<index>[A-Z]\d*)$/;

// Codeforces lists submissions newest first; nobody submits more than this during one duel.
const RECENT_SUBMISSIONS_TO_CHECK = 100;

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
export function findFirstAcceptedSubmission(submissions, problemId, startTime) {
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

// Fetches the user's recent submissions from Codeforces and returns when they first solved
// the problem at or after startTime, or null if they haven't.
export async function getFirstAcceptedSubmission(handle, problemId, startTime) {
    const url = new URL('https://codeforces.com/api/user.status');
    url.searchParams.set('handle', handle);
    url.searchParams.set('from', '1');
    url.searchParams.set('count', String(RECENT_SUBMISSIONS_TO_CHECK));

    const response = await fetch(url);

    let body;
    try {
        body = await response.json();
    } catch {
        // Codeforces sends an HTML error page instead of JSON when it is down.
        throw new Error(`Codeforces request failed with HTTP ${response.status}`);
    }
    if (body.status !== 'OK') {
        // e.g. "handle: User with handle nobody not found" or "Call limit exceeded"
        throw new Error(`Codeforces API error: ${body.comment}`);
    }

    return findFirstAcceptedSubmission(body.result, problemId, startTime);
}
