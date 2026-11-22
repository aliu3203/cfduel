export default function Homepage({ user, onLogout }) {
    return (
        <div>
            <h1>Welcome, {user.username}!</h1>

            <p>Username: {user.username}</p>
            <p>Codeforces Handle: {user.cfHandle ?? "Not linked"}</p>
            <p>Elo Rating: {user.rating}</p>

            <button onClick={onLogout}>
                Logout
            </button>
        </div>
    );
}
