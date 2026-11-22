
import { useState } from "react";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import Homepage from "./HomePage";

export default function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);

    if (user) {
        return (
            <Homepage
                user={user}
                onLogout={() => setUser(null)}
            />
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
