
import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import HomePage from "./HomePage";
import DuelHistory from './DuelHistory.jsx';


export default function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);

    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        fetch(`/api/auth/me`, {
            credentials: "include"
        })
            .then(res => res.ok ? res.json() : null)
            .then(setUser) // set the user to res.json()
            .catch(console.error)
            .finally(() => setCheckingSession(false));
    }, []); // run once on mount []

    if (checkingSession) {
        return <p>Loading...</p>;
    }

    if (user) {
        return (
            <HomePage
                user={user}
                onLogout={() => setUser(null)}
            ><DuelHistory />
            </HomePage>
        );
    }

    return (
        <>
            {page === "login" ? (
                <LoginPage onLogin={setUser} />
            ) : (
                <RegisterPage onSuccess={() => setPage("login")} />
            )}

            <button
                type="button"
                onClick={() => setPage(
                    page === "login" ? "register" : "login"
                )}
            >
                {page === "login"
                    ? "Don't have an account? Register"
                    : "Already have an account? Login"}
            </button>
        </>
    );
}
