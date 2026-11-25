import { useState } from "react";

function UsernameBox({ username, setUsername }) {
    return (
        <label>
            Username:
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
        </label>
    );
}

function PasswordBox({ password, setPassword }) {
    return (
        <label>
            Password:
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
        </label>
    );
}

function LoginButton({ loading }) {
    return (
        <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
        </button>
    );
}

export default function LoginPage({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                setError("Invalid username or password");
                return;
            }
            const userData = await response.json();
            onLogin(userData);

        } catch (err) {
            setError("Cannot connect to server");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <UsernameBox
                username={username}
                setUsername={setUsername}
            />
            <PasswordBox
                password={password}
                setPassword={setPassword}
            />
            <LoginButton loading={loading} />

            {error && <p>{error}</p>}
        </form>
    );
}
