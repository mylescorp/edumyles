export default function MobileAuthSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Mobile sign-in approved</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your EduMyles mobile app can finish signing in now. You can return to the app on your
          phone and close this browser tab.
        </p>
      </div>
    </div>
  );
}
