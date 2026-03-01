import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Minimal auth header — no full navbar */}
            <div className="auth-nav">
                <Link href="/" className="navbar-logo">
                    EduMyles
                </Link>
            </div>
            {children}
        </>
    );
}
