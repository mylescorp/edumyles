import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Policies — EduMyles",
  description:
    "EduMyles terms of service, privacy policy, cookie policy, and other legal policies.",
};

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-inner">
          <p className="eyebrow">Legal</p>
          <h1>Terms &amp; Policies</h1>
          <p className="subtext">
            Our commitment to transparency, security, and your data rights.
          </p>
        </div>
      </section>

      {/* Terms of Service */}
      <section className="content-section" id="terms">
        <div className="content-inner">
          <div className="legal-block">
            <h2>Terms of Service</h2>
            <p className="legal-updated">Last updated: 1 March 2026</p>
            <p>
              By accessing and using EduMyles (&ldquo;the Platform&rdquo;), you
              agree to be bound by these Terms of Service. EduMyles is operated by
              Mylesoft Technologies (&ldquo;we&rdquo;, &ldquo;us&rdquo;,
              &ldquo;our&rdquo;), a company registered in Nairobi, Kenya.
            </p>
            <h3>1. Account &amp; Access</h3>
            <p>
              You must provide accurate information when creating an account. Each
              school tenant is provisioned with its own subdomain
              ({"{slug}"}.edumyles.com) and isolated data environment. You are
              responsible for maintaining the confidentiality of your login
              credentials and for all activities under your account.
            </p>
            <h3>2. Acceptable Use</h3>
            <p>
              You agree to use EduMyles solely for lawful school management
              purposes. You may not attempt to access data belonging to other
              tenants, reverse-engineer the platform, or use the service in any
              manner that could damage, disable, or impair our infrastructure.
            </p>
            <h3>3. Subscriptions &amp; Billing</h3>
            <p>
              EduMyles offers tiered subscription plans (Starter, Standard, Pro,
              Enterprise). The Starter plan is free for schools with up to 100
              students. Paid plans are billed per active student per month,
              payable annually. We accept M-Pesa, Airtel Money, Stripe, and bank
              transfers.
            </p>
            <h3>4. Data Ownership</h3>
            <p>
              Your school&apos;s data belongs to your school. We do not sell,
              share, or monetise your data. You may export your data at any time.
              Upon account termination, we retain data for 30 days before
              permanent deletion unless regulatory requirements mandate longer
              retention.
            </p>
            <h3>5. Service Availability</h3>
            <p>
              We target 99.9% uptime for the EduMyles platform. Scheduled
              maintenance windows will be communicated at least 48 hours in
              advance. We are not liable for downtime caused by third-party
              service providers (Convex, Vercel, payment gateways).
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Policy */}
      <section className="content-section alt" id="privacy">
        <div className="content-inner">
          <div className="legal-block">
            <h2>Privacy Policy</h2>
            <p className="legal-updated">Last updated: 1 March 2026</p>
            <h3>Data We Collect</h3>
            <p>
              We collect information necessary to provide school management
              services: student records, staff profiles, financial transactions,
              academic records, and communication logs. All data is tenant-scoped
              with strict isolation enforced at the database layer.
            </p>
            <h3>How We Use Your Data</h3>
            <p>
              Your data is used solely to deliver the EduMyles service — managing
              students, processing payments, generating reports, and facilitating
              communication. We do not use your data for advertising or sell it to
              third parties.
            </p>
            <h3>Data Security</h3>
            <p>
              We employ industry-standard security measures including encrypted
              data transmission (TLS), tenant isolation at the database level,
              comprehensive audit logging with 7-year retention, and HTTP security
              headers (X-Frame-Options, CSP, HSTS).
            </p>
            <h3>Your Rights</h3>
            <p>
              You have the right to access, correct, export, and delete your data.
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@edumyles.com" className="text-link">
                privacy@edumyles.com
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Policy */}
      <section className="content-section" id="cookies">
        <div className="content-inner">
          <div className="legal-block">
            <h2>Cookie Policy</h2>
            <p className="legal-updated">Last updated: 1 March 2026</p>
            <p>
              EduMyles uses essential cookies for authentication and session
              management (30-day session cookies via WorkOS). We do not use
              tracking cookies, advertising cookies, or third-party analytics
              cookies. No consent banner is required as we only use strictly
              necessary cookies.
            </p>
          </div>
        </div>
      </section>

      {/* Other Policies */}
      <section className="content-section alt" id="other">
        <div className="content-inner">
          <div className="legal-block">
            <h2>Additional Policies</h2>

            <h3>GDPR Compliance</h3>
            <p>
              EduMyles processes data in accordance with GDPR principles where
              applicable. We act as a data processor on behalf of schools (data
              controllers). Data Processing Agreements are available upon request.
            </p>

            <h3>Anti-Spam Policy</h3>
            <p>
              All communications sent through EduMyles (SMS via Africa&apos;s Talking,
              email via Resend) are opt-in and school-initiated. We do not send
              unsolicited marketing messages to students, parents, or staff.
            </p>

            <h3>Abuse Policy</h3>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              our Terms of Service, engage in fraudulent activity, or misuse the
              platform. Report abuse to{" "}
              <a href="mailto:abuse@edumyles.com" className="text-link">
                abuse@edumyles.com
              </a>.
            </p>

            <h3>Trademark Policy</h3>
            <p>
              EduMyles and the EduMyles logo are trademarks of Mylesoft
              Technologies. Partner white-label customers may use their own
              branding as per their Enterprise agreement.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="content-section green-bg">
        <div className="content-inner">
          <div className="section-header centered">
            <h2>Questions about our policies?</h2>
            <p className="section-subtitle light">
              Contact our team for any legal, compliance, or data privacy inquiries.
            </p>
            <div className="actions centered-actions" style={{ marginTop: "1.5rem" }}>
              <a className="btn btn-amber" href="mailto:legal@edumyles.com?subject=Legal%20Inquiry">
                Contact Legal Team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="final-cta-card">
          <h2>Ready to get started?</h2>
          <p>Start your free trial today — your data is safe with us.</p>
          <div className="actions centered-actions">
            <Link className="btn btn-primary" href="/contact">
              Activate Free Trial
            </Link>
            <a className="btn btn-secondary" href="mailto:contact@edumyles.com?subject=Demo%20Request">
              Book a Demo
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
