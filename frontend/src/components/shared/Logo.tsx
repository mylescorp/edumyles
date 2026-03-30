import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "icon" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
  /** White/light version for dark backgrounds */
  inverted?: boolean;
}

const SIZE_MAP = {
  sm:  { icon: 28,  text: "text-sm",  tagline: "text-[9px]"  },
  md:  { icon: 36,  text: "text-base", tagline: "text-[10px]" },
  lg:  { icon: 48,  text: "text-xl",  tagline: "text-xs"     },
  xl:  { icon: 72,  text: "text-3xl", tagline: "text-sm"     },
};

export function Logo({ variant = "full", size = "md", href = "/", className }: LogoProps) {
  const { icon, text, tagline } = SIZE_MAP[size];

  const content = (
    <span className={cn("flex items-center gap-2.5 select-none", className)}>
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
          <span className={cn("font-bold text-[#D4AF37] tracking-tight", text)}>
            EduMyles
          </span>
          <span className={cn("font-medium text-[#6B9E83] tracking-wide uppercase", tagline)}>
            Empowering Education
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="EduMyles — home" className="no-underline">
        {content}
      </Link>
    );
  }
  return content;
}

export default Logo;
