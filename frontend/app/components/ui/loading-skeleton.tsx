/** Themed loading skeleton variants for Zoho One dashboard */

interface SkeletonProps {
  className?: string;
}

export function SkeletonText({ className = "" }: SkeletonProps) {
  return <div className={`skeleton-text ${className}`} />;
}

export function SkeletonHeading({ className = "" }: SkeletonProps) {
  return <div className={`skeleton-heading ${className}`} />;
}

export function SkeletonAvatar({ className = "" }: SkeletonProps) {
  return <div className={`skeleton-avatar ${className}`} />;
}

/** Full stat card skeleton matching the dashboard stat-card pattern */
export function SkeletonStatCard() {
  return (
    <div className="skeleton-card">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton-text w-20" />
        <div className="skeleton w-8 h-8 rounded-lg" />
      </div>
      <div className="skeleton-heading w-16 h-8" />
    </div>
  );
}

/** Full table skeleton matching the table-zoho pattern */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-cream-400 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-cream-400">
        <div className="skeleton-heading w-32" />
      </div>
      <div className="divide-y divide-cream-400">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-4">
            <div className="skeleton-avatar" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-1/3" />
              <div className="skeleton-text w-1/5" />
            </div>
            <div className="skeleton-text w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full page loading with Zoho-style dots */
export function FullPageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <p className="text-amber-500 font-bold text-lg tracking-tight mb-3">EduMyles</p>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-forest-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-forest-500 rounded-full animate-pulse [animation-delay:200ms]" />
          <div className="w-2 h-2 bg-forest-500 rounded-full animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  );
}
