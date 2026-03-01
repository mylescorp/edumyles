import type { Metadata } from "next";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
    title: "Sign Up — EduMyles",
    description: "Create your EduMyles account and start managing your school with a free 30-day trial.",
};

export default function SignUpPage() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>EduMyles</h1>
                    <p>Create your account and start managing your school</p>
                </div>
                <SignUpForm />
            </div>
        </div>
    );
}
