import Image from "next/image";

export default function CallbackLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      {/* Logo */}
      <Image src="/logo-full.svg" alt="EduMyles" width={160} height={44} priority />

      {/* Spinner + message */}
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Animated ring */}
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-transparent"
          style={{
            borderTopColor: "#0F4C2A",
            borderRightColor: "rgba(15,76,42,0.3)",
          }}
        />
        <div className="space-y-1">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
            Signing you in…
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Verifying your credentials, please wait.
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-bounce"
            style={{
              background: "#0F4C2A",
              animationDelay: `${i * 150}ms`,
              opacity: 0.4 + i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
