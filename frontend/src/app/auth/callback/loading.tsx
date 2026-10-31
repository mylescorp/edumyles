import Logo from "@/components/shared/Logo";

export default function CallbackLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6">
      {/* Logo */}
      <Logo variant="full" width={160} height={44} priority href={null} />

      {/* Spinner + message */}
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Animated ring */}
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-transparent"
          style={{
            borderTopColor: "var(--primary)",
            borderRightColor: "rgb(var(--primary-rgb) / 30%)",
          }}
        />
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            Signing you in…
          </p>
          <p className="text-sm text-muted-foreground">
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
              background: "var(--primary)",
              animationDelay: `${i * 150}ms`,
              opacity: 0.4 + i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
