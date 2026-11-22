const USER_RE = /^[a-zA-Z0-9_]{3,30}$/;

export function validateUsernameInfo({ username }) {
    if (typeof username !== 'string') {
        return "username is required";
    }
    if (!USER_RE.test(username)) {
        return "username does not have between 3-30 characters, or contains special characters";
    }
}
