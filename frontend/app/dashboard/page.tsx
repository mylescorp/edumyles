export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-8">
      <div className="text-center animate-slide-up">
        <p className="text-amber-500 font-bold text-2xl tracking-tight mb-2">EduMyles</p>
        <h1 className="text-xl font-semibold text-charcoal">Welcome to EduMyles</h1>
        <p className="mt-2 text-charcoal-300 text-sm">
          You are logged in. Navigate via the sidebar to get started.
        </p>
      </div>
    </main>
  );
}
