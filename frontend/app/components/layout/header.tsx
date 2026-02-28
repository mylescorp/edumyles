"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isImpersonating?: boolean;
}

export function Header({ title, subtitle, isImpersonating = false }: HeaderProps) {
  return (
    <div>
      {isImpersonating && (
        <div className="bg-amber-500 px-6 py-2 text-sm text-charcoal font-semibold">
          You are impersonating another user. All actions are audit logged.
        </div>
      )}
      <header className="bg-white border-b border-cream-400 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-charcoal font-semibold text-lg">{title}</h1>
          {subtitle && <p className="text-charcoal-300 text-sm mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-charcoal-300 hover:text-forest-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-crimson-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-forest-500 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
        </div>
      </header>
    </div>
  );
}
