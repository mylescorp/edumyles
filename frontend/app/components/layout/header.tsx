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
        <div className="bg-orange-600 px-6 py-2 text-sm text-white font-medium">
          ⚠️ You are impersonating another user. All actions are audit logged.
        </div>
      )}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-lg">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-white">
            🔔
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
        </div>
      </header>
    </div>
  );
}
