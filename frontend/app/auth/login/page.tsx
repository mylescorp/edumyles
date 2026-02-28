export default function SignInPage() {
  const error = null;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">EduMyles</h1>
          <p className="text-gray-400 mt-2 text-sm">School Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <h2 className="text-white font-semibold text-xl mb-1">Sign in</h2>
          <p className="text-gray-400 text-sm mb-6">
            Enter your email to receive a magic link
          </p>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 text-sm px-4 py-3 rounded-lg mb-4">
              Authentication failed. Please try again.
            </div>
          )}

          
            href="/auth/login"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-medium py-3 rounded-xl transition-colors"
          >
            Continue with Magic Link
          </a>

          <p className="text-gray-500 text-xs text-center mt-6">
            By signing in, you agree to EduMyles Terms of Service.
            <br />
            Secure login powered by WorkOS.
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          © {new Date().getFullYear()} EduMyles. Built for East Africa.
        </p>
      </div>
    </div>
  );
}
