
import { useState } from 'react';

export default function HomePage({ user, onLogout }) {
    const [cfHandle, setCfHandle] = useState('');
    const [linkedHandle, setLinkedHandle] = useState(user.cfHandle); // null if DNE
    const [cfCode, setCfCode] = useState(null);
    const [cfError, setCfError] = useState('');
    const [loading, setLoading] = useState(false);

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

    async function handleStartVerification() {
        setCfError('');
        setLoading(true);
        // dont allow additional button clicks while this request is processing
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cf/verify/start`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cfHandle })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to start verification");
            }

            setCfCode(data.cfCode);
        } catch (err) {
            setCfError(err.message);
        } finally {
            setLoading(false); 
        }
    }

    async function handleConfirmVerification() {
        setCfError('');
        setLoading(true);
        // dont allow additional button clicks while this request is processing
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/cf/verify/confirm`, {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Verification failed");
            }

            setLinkedHandle(data.cfHandle);
            setCfCode(null);
        } catch (err) {
            setCfError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <h1>Welcome, {user.username}!</h1>

            <p>Username: {user.username}</p>
            <p>Codeforces Handle: {linkedHandle ?? "Not linked"}</p>
            <p>Elo Rating: {user.rating}</p>

            {/* you can update handle even if you have one */}
            <div>
                <h3>Link Codeforces Account</h3>

                <input
                    type="text"
                    placeholder="Codeforces handle"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value)}
                    disabled={loading || cfCode !== null}
                />

                <button
                    onClick={handleStartVerification}
                    disabled={loading || cfCode !== null || !cfHandle.trim()}
                >
                    Start Verification
                </button>

                {/* render this once the cf code is known */}
                {cfCode !== null && (
                    <div>
                        <p>
                            Change your Codeforces profile's first name to:
                        </p>

                        <p><strong>{cfCode}</strong></p>

                        <p>Save your profile, then click Confirm within 10 minutes.</p>

                        <button
                            onClick={handleConfirmVerification}
                            disabled={loading}
                        >
                            Confirm Verification
                        </button>

                        <button
                            onClick={() => {
                                setCfCode(null);
                                setCfError('');
                            }}
                            disabled={loading}
                        >
                            Back
                        </button>
                    </div>
                )}

                {cfError && <p>{cfError}</p>}
            </div>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}
