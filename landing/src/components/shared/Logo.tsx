import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 28, text: "text-sm",  tagline: "text-[9px]"  },
  md: { icon: 36, text: "text-base", tagline: "text-[10px]" },
  lg: { icon: 48, text: "text-xl",  tagline: "text-xs"     },
};

export default function Logo({ variant = "full", size = "md", href = "/", className = "" }: LogoProps) {
  const { icon, text, tagline } = SIZE_MAP[size];

  const content = (
    <span className={`flex items-center gap-2.5 select-none ${className}`}>
      <Image
        src="/logo-icon.svg"
        alt="EduMyles"
        width={icon}
        height={icon}
        className="flex-shrink-0"
        priority
      />
      {variant === "full" && (
        <span className="flex flex-col gap-0 leading-none">
          <span className={`font-bold text-[#061A12] tracking-tight ${text}`}>EduMyles</span>
          <span className={`font-medium text-[#6B9E83] tracking-wide ${tagline}`}>
            Empowering Schools, One Mile at a Time.
          </span>
        </span>
      )}
    </span>
  );

  return (
    <Link href={href} aria-label="EduMyles — home" className="no-underline">
      {content}
    </Link>
  );
}
