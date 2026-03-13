import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9fafb",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ 
          fontSize: "4rem", 
          fontWeight: "bold", 
          color: "#1f2937", 
          marginBottom: "1rem" 
        }}>
          404
        </h1>
        <h2 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "600", 
          color: "#374151", 
          marginBottom: "1rem" 
        }}>
          Page Not Found
        </h2>
        <p style={{ 
          color: "#6b7280", 
          marginBottom: "2rem", 
          maxWidth: "400px",
          margin: "0 auto 2rem"
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#1A395B",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.5rem",
            fontWeight: "500"
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
