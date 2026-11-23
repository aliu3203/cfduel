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

function EmailBox({ email, setEmail }) {
    return (
        <label>
            Email:
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

function RegisterButton({ loading }) {
    return (
        <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
        </button>
    );
}

export default function RegisterPage({ onSuccess }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:3000/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "Something went wrong");
                return;
            }

            onSuccess();

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
            <EmailBox
                email={email}
                setEmail={setEmail}
            />
            <PasswordBox
                password={password}
                setPassword={setPassword}
            />
            <RegisterButton loading={loading} />

            {error && <p>{error}</p>}
        </form>
    );
}
