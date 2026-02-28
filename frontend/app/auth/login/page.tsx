export default function SignInPage() {
  const error = null;

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">EduMyles</h1>
          <p className="text-forest-200/60 mt-2 text-sm">School Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-charcoal font-semibold text-xl mb-1">Sign in</h2>
          <p className="text-charcoal-300 text-sm mb-6">
            Enter your email to receive a magic link
          </p>

          {error && (
            <div className="bg-crimson-50 border border-crimson-200 text-crimson-700 text-sm px-4 py-3 rounded-lg mb-4">
              Authentication failed. Please try again.
            </div>
          )}

          <a
            href="/auth/login"
            className="block w-full bg-crimson-500 hover:bg-crimson-600 text-white text-center font-semibold py-3 rounded-xl transition-colors uppercase tracking-wide text-sm"
          >
            Continue with Magic Link
          </a>

          <p className="text-charcoal-200 text-xs text-center mt-6">
            By signing in, you agree to EduMyles Terms of Service.
            <br />
            Secure login powered by WorkOS.
          </p>
        </div>

        <p className="text-center text-forest-200/50 text-xs mt-6">
          &copy; {new Date().getFullYear()} EduMyles. Built for East Africa.
        </p>
      </div>
    </div>
  );
}
