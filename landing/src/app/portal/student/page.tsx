"use client";

export default function StudentDashboardPage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
        }}
      >
        <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "1rem", color: "#1a1a1a" }}>
          Student Dashboard
        </h1>

        <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
          <p style={{ margin: 0, color: "#666" }}>
            Welcome back! You have successfully logged in as a student.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>📆 Timetable</h3>
            <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              Stay on top of your classes and school schedule
            </p>
          </div>

          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>📖 Assignments</h3>
            <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              Check assignments, submissions, and upcoming deadlines
            </p>
          </div>

          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1a1a1a" }}>🏅 Results</h3>
            <p style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              Review grades, report cards, and academic progress
            </p>
          </div>
        </div>

        <div style={{ background: "#f0f9ff", border: "1px solid #0ea5e9", borderRadius: "8px", padding: "1rem" }}>
          <p style={{ margin: 0, color: "#0c4a6e" }}>
            <strong>🎉 Authentication Successful!</strong> This is a temporary student dashboard on the landing deployment.
            The full student portal can now be connected without changing the sign-in flow.
          </p>
        </div>
      </div>
    </div>
  );
}
