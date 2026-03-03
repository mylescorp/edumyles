"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/auth/login/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
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

    function handleSSOLogin(provider: "GoogleOAuth" | "MicrosoftOAuth") {
        const clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID;
        const redirectUri =
            process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
            (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "");

        if (!clientId) {
            console.error("NEXT_PUBLIC_WORKOS_CLIENT_ID is missing");
            setError("Authentication service not configured");
            return;
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            provider: provider,
            screen_hint: "sign-in",
        });

        window.location.href = `https://api.workos.com/user-management/authorize?${params.toString()}`;
    }

    return (
        <div className="auth-card">
            <h2>Sign in to your account</h2>
            <p className="auth-subtitle">Choose your preferred sign-in method</p>

            {error && <div className="auth-error">{error}</div>}

            {/* Social / SSO buttons */}
            <div className="auth-sso-buttons">
                <button type="button" onClick={() => handleSSOLogin("GoogleOAuth")} className="sso-button">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                <button type="button" onClick={() => handleSSOLogin("MicrosoftOAuth")} className="sso-button">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF" />
                        <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900" />
                        <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022" />
                        <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00" />
                    </svg>
                    Continue with Microsoft
                </button>
            </div>

            <div className="auth-divider">
                <span>Or continue with email</span>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailLogin} className="auth-form">
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
                    {isLoading ? "Redirecting..." : "Continue with Email"}
                </button>
            </form>

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
