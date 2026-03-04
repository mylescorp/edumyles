"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function redirectToAuthKit(opts: { email?: string } = {}) {
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/auth/login/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: opts.email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to initiate sign in");
            }

            window.location.href = data.authUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsLoading(false);
        }
    }

    function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        redirectToAuthKit({ email });
    }

    return (
        <div className="auth-card">
            <h2>Sign in to your account</h2>
            <p className="auth-subtitle">Enter your email to continue</p>

            {error && <div className="auth-error">{error}</div>}

            {/* Email form */}
            <form onSubmit={handleEmailLogin} className="auth-form" style={{ marginTop: "1.5rem" }}>
                <div className="form-group">
                    <label htmlFor="email">Email address</label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@school.ac.ke"
                    />
                </div>

                <button type="submit" disabled={isLoading} className="btn btn-primary auth-submit">
                    {isLoading ? "Redirecting..." : "Continue"}
                </button>
            </form>

            <p className="auth-footer-text" style={{ marginTop: "1rem", fontSize: "0.82rem", color: "#6b6b6b" }}>
                You&apos;ll be able to sign in with Google, Microsoft, or email on the next screen.
            </p>

            <p className="auth-footer-text">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="auth-link">Sign up free</Link>
            </p>

            <p className="auth-legal">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="auth-link">Terms of Service</Link> and{" "}
                <Link href="/terms#privacy" className="auth-link">Privacy Policy</Link>
            </p>
        </div>
    );
}
