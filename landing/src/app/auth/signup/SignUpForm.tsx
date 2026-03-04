"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/auth/signup/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          schoolName: schoolName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign-up could not be started");
      }
      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }
      throw new Error("No redirect URL received");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Create your account</h2>
      <p className="auth-subtitle">Get started with a free trial</p>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="signup-school">School name (optional)</label>
          <input
            id="signup-school"
            type="text"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g. Greenfield Academy"
            disabled={isLoading}
            autoComplete="organization"
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-email">Work email</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.ac.ke"
            disabled={isLoading}
            required
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary auth-submit"
        >
          {isLoading ? "Redirecting…" : "Continue with email or SSO"}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{" "}
        <Link href="/auth/login" className="auth-link">
          Sign in
        </Link>
      </p>
      <p className="auth-legal">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="auth-link">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/terms#privacy" className="auth-link">Privacy Policy</Link>.
      </p>
    </div>
  );
}
