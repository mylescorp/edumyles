"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LoginForm({
  initialError,
}: {
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialError) {
      try {
        setError(decodeURIComponent(initialError));
      } catch {
        setError(initialError);
      }
    }
  }, [initialError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/auth/login/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Sign-in could not be started");
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
      <h2>Sign in</h2>
      <p className="auth-subtitle">Use your email or a provider to continue</p>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="login-email">Email (optional)</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.ac.ke"
            disabled={isLoading}
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
        No account?{" "}
        <Link href="/auth/signup" className="auth-link">
          Sign up free
        </Link>
      </p>
      <p className="auth-legal">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="auth-link">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/terms#privacy" className="auth-link">Privacy Policy</Link>.
      </p>
    </div>
  );
}
