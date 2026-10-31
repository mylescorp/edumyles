import Logo from "@/components/shared/Logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Pulsing logo */}
      <div className="relative animate-pulse">
        <Logo variant="icon" width={96} height={96} priority className="h-auto w-auto drop-shadow-lg" href={null} />
      </div>

      {/* Brand name */}
      <p className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        EduMyles
      </p>
      <p className="mt-1 text-xs font-medium tracking-[0.22em] uppercase text-muted-foreground">
        Empowering Education
      </p>

      {/* Spinner bar */}
      <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" />
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
