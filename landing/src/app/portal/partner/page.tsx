"use client";

import { useEffect } from "react";

export default function PartnerRedirectPage() {
  const frontendUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  useEffect(() => {
    window.location.href = `${frontendUrl}/portal/partner`;
  }, [frontendUrl]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <div>Redirecting to partner dashboard...</div>
      <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
        If you&apos;re not redirected automatically,{" "}
        <a href={`${frontendUrl}/portal/partner`} style={{ color: "#007bff" }}>
          click here
        </a>
      </div>
    </div>
  );
}
