"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignUpForm() {
    const [email, setEmail] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/auth/signup/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, schoolName }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create account");
            }

            window.location.href = data.authUrl;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-card">
            <h2>Create your account</h2>
            <p className="auth-subtitle">Get started with a free 30-day trial</p>

            {error && <div className="auth-error">{error}</div>}

            {/* Email form */}
            <form onSubmit={handleSignUp} className="auth-form" style={{ marginTop: "1.5rem" }}>
                <div className="form-group">
                    <label htmlFor="schoolName">School name</label>
                    <input
                        id="schoolName"
                        type="text"
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Greenfield Academy"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Work email</label>
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
                    {isLoading ? "Creating account..." : "Create Account"}
                </button>
            </form>

            <p className="auth-footer-text" style={{ marginTop: "1rem", fontSize: "0.82rem", color: "#6b6b6b" }}>
                You&apos;ll be able to sign up with Google, Microsoft, or email on the next screen.
            </p>

            <div className="auth-benefits">
                <div className="auth-benefit">
                    <span className="check-icon">&#10003;</span> Free for 30 days, no credit card required
                </div>
                <div className="auth-benefit">
                    <span className="check-icon">&#10003;</span> Free onboarding support and training
                </div>
                <div className="auth-benefit">
                    <span className="check-icon">&#10003;</span> Cancel anytime
                </div>
            </div>

            <p className="auth-footer-text">
                Already have an account?{" "}
                <Link href="/auth/login" className="auth-link">Sign in</Link>
            </p>

            <p className="auth-legal">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="auth-link">Terms of Service</Link> and{" "}
                <Link href="/terms#privacy" className="auth-link">Privacy Policy</Link>
            </p>
        </div>
    );
}
