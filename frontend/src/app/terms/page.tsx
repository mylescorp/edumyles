import Link from "next/link";

export default function TermsPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Legal</p>
          <h1>Terms, Privacy, and Platform Policies</h1>
          <p className="subtext">
            Key legal and platform policy summaries for institutions using EduMyles. We are committed
            to transparency, security, and responsible data handling.
          </p>
        </div>
      </section>

      <section className="content-section">
        <div className="content-inner">
          <div className="legal-block">
            <p className="legal-updated">Last updated: March 2025</p>

            <h2>Terms of Service</h2>
            <p>
              By using EduMyles, you agree to these terms. EduMyles is provided by Mylesoft
              Technologies Ltd, registered in Kenya. These terms govern your access to and use of
              the EduMyles platform.
            </p>

            <h3>1. Account Registration</h3>
            <p>
              You must provide accurate information when creating an account. Each school or
              institution is responsible for managing user access within their organization.
              Administrative accounts must be held by authorized representatives of the institution.
            </p>

            <h3>2. Acceptable Use</h3>
            <p>
              EduMyles is designed for school management operations. You agree to use the platform
              only for lawful purposes related to educational administration, student management,
              financial operations, and stakeholder communication.
            </p>

            <h3>3. Subscription and Billing</h3>
            <p>
              Free trials are 30 days with full access. Paid plans are billed monthly or annually
              based on active student count. Pricing may be updated with 30 days advance notice.
              Refunds are available within 14 days of initial payment.
            </p>

            <h3>4. Data Ownership</h3>
            <p>
              You retain full ownership of all data entered into EduMyles. We do not sell, share,
              or monetize your data. Upon account termination, data is preserved for 90 days and
              can be exported at any time.
            </p>

            <h2>Privacy Policy</h2>

            <h3>5. Data Collection</h3>
            <p>
              We collect information necessary to provide our services: account details, student
              records, financial data, and usage analytics. We do not collect data beyond what is
              necessary for platform operation and improvement.
            </p>

            <h3>6. Data Protection</h3>
            <p>
              All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We maintain strict
              multi-tenant data isolation, ensuring one school cannot access another school&apos;s
              data. Regular security audits and penetration testing are conducted.
            </p>

            <h3>7. Third-Party Services</h3>
            <p>
              We use trusted third-party services for specific functions: payment processing (M-Pesa,
              Stripe), email delivery (Resend), authentication (WorkOS), and infrastructure (Vercel,
              Convex). Each provider is vetted for security and compliance.
            </p>

            <h2>Security &amp; Compliance</h2>

            <h3>8. Infrastructure Security</h3>
            <p>
              EduMyles runs on enterprise-grade cloud infrastructure with 99.9% uptime SLA,
              automatic failover, global CDN distribution, and daily automated backups with
              point-in-time recovery.
            </p>

            <h3>9. Access Controls</h3>
            <p>
              Role-based access control (RBAC) ensures users only see data relevant to their role.
              Full audit trails track every data access and modification. Session management includes
              automatic timeouts and multi-device controls.
            </p>

            <h3>10. Incident Response</h3>
            <p>
              We maintain a documented incident response plan. In the event of a security incident,
              affected institutions are notified within 24 hours with details of the incident,
              impact assessment, and remediation steps.
            </p>

            <h3>Contact</h3>
            <p>
              For questions about these policies, contact us at{" "}
              <a href="mailto:legal@edumyles.com" className="text-link">legal@edumyles.com</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Questions about our policies?</h2>
          <p>Our team is happy to discuss security, compliance, and data handling in detail.</p>
          <div className="centered-actions">
            <Link className="btn btn-primary" href="/contact">Contact Us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
