import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#061A12]">
      {/* Pulsing logo */}
      <div className="relative animate-pulse">
        <Image
          src="/logo-icon.svg"
          alt="EduMyles"
          width={96}
          height={96}
          priority
          className="h-auto w-auto drop-shadow-[0_0_24px_rgba(212,175,55,0.4)]"
        />
      </div>

      {/* Brand name */}
      <p
        className="mt-5 text-2xl font-bold tracking-tight"
        style={{ color: "#D4AF37", fontFamily: "var(--font-playfair, Georgia, serif)" }}
      >
        EduMyles
      </p>
      <p
        className="mt-1 text-xs font-medium tracking-[0.22em] uppercase"
        style={{ color: "#6B9E83" }}
      >
        Empowering Education
      </p>

      {/* Spinner bar */}
      <div className="mt-8 w-40 h-1 rounded-full bg-[#0F3D22] overflow-hidden">
        <div
          className="h-full rounded-full animate-[shimmer_1.4s_ease-in-out_infinite]"
          style={{ background: "linear-gradient(90deg, #9B7A0A, #F7DF82, #9B7A0A)", backgroundSize: "200% 100%" }}
        />
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
