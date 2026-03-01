"use client";

import { useState } from "react";

export default function FounderImage() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="founder-avatar-fallback">JM</div>;
  }

  return (
    <img
      src="/team/jonathan-myles.jpg"
      alt="Jonathan Myles — CEO & Founder of EduMyles"
      width={400}
      height={400}
      onError={() => setFailed(true)}
    />
  );
}
