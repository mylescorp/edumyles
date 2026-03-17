"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignUpForm() {
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSSOSignup(provider: string) {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/auth/signup/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          schoolName: schoolName || undefined,
          provider,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSSOSignup("email");
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

      {/* SSO Provider Buttons */}
      <div className="auth-sso-buttons">
        <button
          type="button"
          onClick={() => handleSSOSignup("google")}
          disabled={isLoading}
          className="btn btn-sso btn-google"
        >
          <svg className="sso-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => handleSSOSignup("microsoft")}
          disabled={isLoading}
          className="btn btn-sso btn-microsoft"
        >
          <svg className="sso-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#F25022" d="M11.4 11.4H2.6V2.6h8.8v8.8z"/>
            <path fill="#7FBA00" d="M21.4 11.4h-8.8V2.6h8.8v8.8z"/>
            <path fill="#00A4EF" d="M11.4 21.4H2.6v-8.8h8.8v8.8z"/>
            <path fill="#FFB900" d="M21.4 21.4h-8.8v-8.8h8.8v8.8z"/>
          </svg>
          Continue with Microsoft
        </button>
      </div>

      <div className="auth-divider">
        <span>or</span>
      </div>

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
          {isLoading ? "Creating account…" : "Continue with email"}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{" "}
        <Link href="/auth/login/api" className="auth-link">
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
