"use client";

import { useState } from "react";

interface FounderImageProps {
  src?: string;
  alt: string;
  initials: string;
}

export default function FounderImage({ src, alt, initials }: FounderImageProps) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="founder-avatar-fallback" style={{ display: "flex" }}>
        {initials}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", display: "block", borderRadius: "16px" }}
        onError={() => setImgError(true)}
      />
    </>
  );
}
