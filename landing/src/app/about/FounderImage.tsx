"use client";

import { useState } from "react";

export default function FounderImage() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="founder-avatar-fallback">JM</div>;
  }

  return (
    <img
      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face"
      alt="Jonathan Myles — CEO & Founder of EduMyles"
      width={400}
      height={400}
      className="founder-photo"
      onError={() => setFailed(true)}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: "16px",
        objectFit: "cover",
        aspectRatio: "3/4"
      }}
    />
  );
}
