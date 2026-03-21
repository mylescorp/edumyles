"use client";

import { useEffect } from "react";

export default function TeacherRedirectPage() {
  const frontendUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  useEffect(() => {
    window.location.href = `${frontendUrl}/portal/teacher`;
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
      <div>Redirecting to teacher dashboard...</div>
      <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
        If you&apos;re not redirected automatically,{" "}
        <a href={`${frontendUrl}/portal/teacher`} style={{ color: "#007bff" }}>
          click here
        </a>
      </div>
    </div>
  );
}
