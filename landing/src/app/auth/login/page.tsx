import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
    title: "Sign In — EduMyles",
    description: "Sign in to your EduMyles school management platform.",
};

export default function LoginPage() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>EduMyles</h1>
                    <p>Sign in to your school management platform</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
