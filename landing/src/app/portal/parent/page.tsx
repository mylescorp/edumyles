"use client";

export default function ParentDashboardPage() {
  return (
    <div style={{ 
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)"
      }}>
        <h1 style={{ 
          fontSize: "2rem", 
          fontWeight: "700", 
          marginBottom: "1rem",
          color: "#1a1a1a"
        }}>
          Parent Dashboard
        </h1>
        
        <div style={{ 
          background: "#f8f9fa", 
          padding: "1rem", 
          borderRadius: "8px",
          marginBottom: "2rem"
        }}>
          <p style={{ margin: 0, color: "#666" }}>
            Welcome back! You have successfully logged in as a parent.
          </p>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>👶 My Children</h3>
            <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              View your children&apos;s profiles and progress
            </p>
          </div>

          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>📚 Grades & Reports</h3>
            <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              Monitor academic performance
            </p>
          </div>

          <div style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>💳 Fees & Payments</h3>
            <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              Manage school fees and payments
            </p>
          </div>
        </div>

        <div style={{ 
          background: "#f0f9ff", 
          border: "1px solid #0ea5e9",
          borderRadius: "8px",
          padding: "1rem"
        }}>
          <p style={{ margin: 0, color: "#0c4a6e" }}>
            <strong>🎉 Authentication Successful!</strong> This is a temporary parent dashboard. 
            The full parent dashboard will be available once the frontend application is deployed.
          </p>
        </div>
      </div>
    </div>
  );
}
