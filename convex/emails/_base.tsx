import * as React from "react";

export type EmailAction = {
  label: string;
  href: string;
};

export type EmailSection = {
  title?: string;
  body: string;
};

export type EmailShellProps = {
  preview: string;
  heading: string;
  eyebrow?: string;
  intro?: string;
  sections?: EmailSection[];
  action?: EmailAction;
  outro?: string;
  footerNote?: string;
  brandName?: string;
  accentColor?: string;
};

const styles = {
  body: {
    margin: 0,
    padding: "0",
    backgroundColor: "#f5f7fb",
    color: "#163024",
    fontFamily: "Segoe UI, Arial, sans-serif",
  },
  wrapper: {
    width: "100%",
    padding: "28px 12px",
  },
  card: {
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #d9e5dd",
    boxShadow: "0 10px 35px rgba(10, 40, 22, 0.08)",
  },
  header: (accentColor: string) => ({
    background: `linear-gradient(135deg, ${accentColor} 0%, #0b3a23 100%)`,
    color: "#ffffff",
    padding: "28px 32px",
  }),
  content: {
    padding: "32px",
  },
  eyebrow: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    opacity: 0.88,
  },
  heading: {
    margin: "12px 0 0",
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: 800,
  },
  intro: {
    margin: "0 0 20px",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#3f5a4b",
  },
  section: {
    marginTop: "18px",
    padding: "18px 20px",
    borderRadius: "14px",
    backgroundColor: "#f7faf8",
    border: "1px solid #e0ebe4",
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f2e1d",
  },
  sectionBody: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#456151",
    whiteSpace: "pre-line" as const,
  },
  buttonWrap: {
    marginTop: "28px",
    textAlign: "center" as const,
  },
  button: (accentColor: string) => ({
    display: "inline-block",
    padding: "14px 22px",
    borderRadius: "999px",
    backgroundColor: accentColor,
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  }),
  outro: {
    marginTop: "24px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#456151",
    whiteSpace: "pre-line" as const,
  },
  footer: {
    marginTop: "28px",
    paddingTop: "18px",
    borderTop: "1px solid #e4ece6",
    fontSize: "12px",
    lineHeight: 1.7,
    color: "#6b8375",
  },
  footerLink: {
    color: "#0f7b45",
  },
};

export function EmailShell({
  preview,
  heading,
  eyebrow = "EduMyles",
  intro,
  sections = [],
  action,
  outro,
  footerNote,
  brandName = "EduMyles",
  accentColor = "#0f7b45",
}: EmailShellProps) {
  return (
    <html>
      <head>
        <title>{heading}</title>
        <meta content={preview} name="description" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
      </head>
      <body style={styles.body}>
        <div style={{ display: "none", overflow: "hidden", maxHeight: 0 }}>{preview}</div>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.header(accentColor)}>
              <p style={styles.eyebrow}>{eyebrow}</p>
              <h1 style={styles.heading}>{heading}</h1>
            </div>
            <div style={styles.content}>
              {intro ? <p style={styles.intro}>{intro}</p> : null}
              {sections.map((section, index) => (
                <div key={`${section.title ?? "section"}-${index}`} style={styles.section}>
                  {section.title ? <p style={styles.sectionTitle}>{section.title}</p> : null}
                  <p style={styles.sectionBody}>{section.body}</p>
                </div>
              ))}
              {action ? (
                <div style={styles.buttonWrap}>
                  <a href={action.href} style={styles.button(accentColor)}>
                    {action.label}
                  </a>
                </div>
              ) : null}
              {outro ? <p style={styles.outro}>{outro}</p> : null}
              <div style={styles.footer}>
                <div>{footerNote ?? `${brandName} platform communication`}</div>
                <div>Need help? Reply to this message or contact support at support@edumyles.co.ke.</div>
                <div>
                  Unsubscribe preferences:{" "}
                  <a href="https://edumyles.co.ke/unsubscribe" style={styles.footerLink}>
                    manage notifications
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

export function buildPlainTextEmail(input: {
  heading: string;
  intro?: string;
  sections?: EmailSection[];
  action?: EmailAction;
  outro?: string;
  brandName?: string;
}) {
  const parts: string[] = [input.heading];
  if (input.intro) parts.push("", input.intro);
  for (const section of input.sections ?? []) {
    parts.push("", section.title ? `${section.title}\n${section.body}` : section.body);
  }
  if (input.action) parts.push("", `${input.action.label}: ${input.action.href}`);
  if (input.outro) parts.push("", input.outro);
  parts.push(
    "",
    `${input.brandName ?? "EduMyles"} support: support@edumyles.co.ke`,
    "Manage notifications: https://edumyles.co.ke/unsubscribe"
  );
  return parts.join("\n");
}
