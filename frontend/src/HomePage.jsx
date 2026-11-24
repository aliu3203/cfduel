export default function HomePage({ user, onLogout }) {
    async function handleLogout() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }
            
            onLogout();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            <h1>Welcome, {user.username}!</h1>

            <p>Username: {user.username}</p>
            <p>Codeforces Handle: {user.cfHandle ?? "Not linked"}</p>
            <p>Elo Rating: {user.rating}</p>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}
