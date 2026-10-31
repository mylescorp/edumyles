import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "icon" | "full" | "lockup";
  size?: "sm" | "md" | "lg";
  width?: number;
  height?: number;
  href?: string | null;
  className?: string;
  priority?: boolean;
  appearance?: "auto" | "light" | "dark";
}

const SIZE_MAP = {
  sm: { full: 132, icon: 28, lockup: 320 },
  md: { full: 180, icon: 36, lockup: 360 },
  lg: { full: 220, icon: 48, lockup: 420 },
};

export default function Logo({
  variant = "full",
  size = "md",
  width,
  height,
  href = "/",
  className = "",
  priority = false,
  appearance = "auto",
}: LogoProps) {
  const imageWidth = width ?? SIZE_MAP[size][variant];
  const imageHeight = height ?? (variant === "icon" ? imageWidth : Math.round(imageWidth / (variant === "lockup" ? 3.52 : 3.59)));
  const asset = variant === "icon" ? "mark" : variant === "lockup" ? "lockup" : "wordmark";
  const variants = appearance === "auto" ? ["light", "dark"] : [appearance];

  const content = (
    <span className={`inline-flex shrink-0 select-none ${className}`}>
      {variants.map((theme) => (
        <Image
          key={theme}
          src={`/edumyles-${asset}-${theme}.png`}
          alt="EduMyles"
          width={imageWidth}
          height={imageHeight}
          priority={priority}
          sizes={`${imageWidth}px`}
          className={`h-auto max-w-full ${variant === "icon" ? "aspect-square" : ""} ${
            appearance === "auto"
              ? theme === "dark"
                ? "hidden dark:block"
                : "block dark:hidden"
              : ""
          }`}
        />
      ))}
    </span>
  );

  return href ? (
    <Link href={href} aria-label="EduMyles — home" className="inline-flex no-underline">
      {content}
    </Link>
  ) : (
    content
  );
}
