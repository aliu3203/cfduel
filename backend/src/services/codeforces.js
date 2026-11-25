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

// Returns the user's earliest accepted submission of the problem at or after startTime,
// as { time, status: 'accepted' }, or null if there isn't one.
// Codeforces records times in whole seconds, so a submission in the same second as the start counts.
export function findEarliestSubmission(submissions, problemId, startTime) {
    const problem = parseProblemId(problemId);
    const startSeconds = Math.floor(startTime.getTime() / 1000);

    const candidates = submissions.filter((submission) =>
        submission.verdict === 'OK'
        && submission.problem.contestId === problem.contestId
        && submission.problem.index === problem.index
        && submission.creationTimeSeconds >= startSeconds
    );

    if (candidates.length === 0) {
        return null;
    }
    const earliest = candidates.reduce((earliestSoFar, submission) =>
        submission.creationTimeSeconds < earliestSoFar.creationTimeSeconds ? submission : earliestSoFar
    );
    return { time: new Date(earliest.creationTimeSeconds * 1000), status: 'accepted' };
}

// Fetches the user's recent submissions from Codeforces and returns their earliest accepted
// submission of the problem at or after startTime, as { time, status }, or null if there isn't one.
export async function getEarliestSubmission(handle, problemId, startTime) {
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

    return findEarliestSubmission(body.result, problemId, startTime);
}
