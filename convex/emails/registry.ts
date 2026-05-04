export type RenderedTemplate = {
  subject: string;
  html: string;
  text: string;
};

type TemplateInput = {
  preview: string;
  eyebrow: string;
  heading: string;
  intro?: string;
  sections?: Array<{ title?: string; body: string }>;
  action?: { label: string; href: string };
  outro?: string;
};

const defaultInviteUrl = "https://edumyles.co.ke/invite/accept";
const defaultSetupUrl = "https://edumyles.co.ke/admin/setup";
const defaultBillingUrl = "https://edumyles.co.ke/admin/settings/billing";
const defaultDashboardUrl = "https://edumyles.co.ke/admin";
const defaultParentJoinUrl = "https://edumyles.co.ke/join";
const defaultStaffInviteUrl = "https://edumyles.co.ke/staff/accept";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function newlineToBr(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function renderHtml(input: TemplateInput) {
  const sections = (input.sections ?? [])
    .map(
      (section) => `
        <div style="margin-top:18px;padding:18px 20px;border-radius:14px;background:#f7faf8;border:1px solid #e0ebe4;">
          ${section.title ? `<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0f2e1d;">${escapeHtml(section.title)}</p>` : ""}
          <p style="margin:0;font-size:14px;line-height:1.7;color:#456151;">${newlineToBr(section.body)}</p>
        </div>
      `
    )
    .join("");

  const action = input.action
    ? `
      <div style="margin-top:28px;text-align:center;">
        <a href="${escapeHtml(input.action.href)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0f7b45;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
          ${escapeHtml(input.action.label)}
        </a>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(input.heading)}</title>
    <meta name="description" content="${escapeHtml(input.preview)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;color:#163024;font-family:Segoe UI,Arial,sans-serif;">
    <div style="display:none;overflow:hidden;max-height:0;">${escapeHtml(input.preview)}</div>
    <div style="width:100%;padding:28px 12px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #d9e5dd;box-shadow:0 10px 35px rgba(10,40,22,0.08);">
        <div style="background:linear-gradient(135deg,#0f7b45 0%,#0b3a23 100%);color:#ffffff;padding:28px 32px;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.88;">${escapeHtml(input.eyebrow)}</p>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;font-weight:800;">${escapeHtml(input.heading)}</h1>
        </div>
        <div style="padding:32px;">
          ${input.intro ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#3f5a4b;">${newlineToBr(input.intro)}</p>` : ""}
          ${sections}
          ${action}
          ${input.outro ? `<p style="margin-top:24px;font-size:14px;line-height:1.7;color:#456151;">${newlineToBr(input.outro)}</p>` : ""}
          <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e4ece6;font-size:12px;line-height:1.7;color:#6b8375;">
            <div>EduMyles platform communication</div>
            <div>Need help? Reply to this message or contact support at support@edumyles.co.ke.</div>
            <div>Unsubscribe preferences: <a href="https://edumyles.co.ke/unsubscribe" style="color:#0f7b45;">manage notifications</a></div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function renderText(input: TemplateInput) {
  const parts: string[] = [input.heading];
  if (input.intro) parts.push("", input.intro);
  for (const section of input.sections ?? []) {
    parts.push("", section.title ? `${section.title}\n${section.body}` : section.body);
  }
  if (input.action) parts.push("", `${input.action.label}: ${input.action.href}`);
  if (input.outro) parts.push("", input.outro);
  parts.push("", "EduMyles support: support@edumyles.co.ke", "Manage notifications: https://edumyles.co.ke/unsubscribe");
  return parts.join("\n");
}

function render(input: TemplateInput, subject: string): RenderedTemplate {
  return {
    subject,
    html: renderHtml(input),
    text: renderText(input),
  };
}

export function renderManagedEmailTemplate(template: string, data: Record<string, any> = {}): RenderedTemplate | null {
  switch (template) {
    case "waitlist_confirmation":
      return render(
        {
          preview: `You are on the EduMyles waitlist for ${data.schoolName ?? "your school"}.`,
          eyebrow: "Waitlist Confirmation",
          heading: `You're on the EduMyles waitlist, ${data.firstName ?? "there"}!`,
          intro: `Thanks for joining the EduMyles waitlist for ${data.schoolName ?? "your school"}. Our platform team will review your school details and reach out with next steps.`,
          sections: [
            { title: "What to expect next", body: "We review qualification details, school size, and rollout readiness before sending an invitation to create your EduMyles workspace." },
            { title: "How long it usually takes", body: "High-fit schools are typically contacted first. If we need extra details, we will use the email address or phone number you shared." },
          ],
        },
        `You're on the EduMyles waitlist, ${data.firstName ?? "there"}!`
      );
    case "tenant_invite":
      return render(
        {
          preview: `Your EduMyles invitation for ${data.schoolName ?? "your school"} is ready.`,
          eyebrow: "Tenant Invitation",
          heading: `Your EduMyles invitation is ready, ${data.firstName ?? "there"}!`,
          intro: `You’ve been invited to create the school-admin workspace for ${data.schoolName ?? "your school"}. Use the secure link below to create your admin account and begin the 12-step school setup flow.`,
          sections: [
            ...(data.personalMessage ? [{ title: "Personal note", body: String(data.personalMessage) }] : []),
            {
              title: "Your school workspace",
              body: `School: ${data.schoolName ?? "Your school"}\nRole: ${data.role ?? "school_admin"}\nTenant URL: ${data.tenantUrl ?? "Your EduMyles school subdomain"}`,
            },
            {
              title: "What is included",
              body: "Your invitation includes the school admin account, WorkOS organization membership, the setup wizard, core SIS modules, and the live tenant workspace.",
            },
            { title: "Invitation expiry", body: `This invitation stays active until ${data.expiryDate ?? "soon"}.` },
          ],
          action: { label: "Create My School Admin Account", href: data.inviteUrl ?? defaultInviteUrl },
          outro: `After creating the account, continue setup at ${data.setupUrl ?? defaultSetupUrl}. If the tenant subdomain is still waiting for HTTPS activation, use ${data.appUrl ?? defaultDashboardUrl} and sign in with this email.`,
        },
        `Your EduMyles invitation is ready, ${data.firstName ?? "there"}!`
      );
    case "tenant_invite_reminder_day3":
      return render(
        {
          preview: `Your EduMyles invitation for ${data.schoolName ?? "your school"} expires in 4 days.`,
          eyebrow: "Invite Reminder",
          heading: "Your invitation expires in 4 days",
          intro: `Your EduMyles setup invitation for ${data.schoolName ?? "your school"} is still waiting for you. Finish account creation before ${data.expiryDate ?? "soon"}.`,
          action: { label: "Resume Invitation", href: data.inviteUrl ?? defaultInviteUrl },
        },
        "Your invitation expires in 4 days"
      );
    case "tenant_invite_reminder_day6":
      return render(
        {
          preview: `Last chance: your EduMyles invitation for ${data.schoolName ?? "your school"} expires tomorrow.`,
          eyebrow: "Urgent Reminder",
          heading: "Last chance — expires tomorrow",
          intro: `This is your final reminder to accept the EduMyles invitation for ${data.schoolName ?? "your school"}. The current link expires on ${data.expiryDate ?? "soon"}.`,
          action: { label: "Accept Invitation Now", href: data.inviteUrl ?? defaultInviteUrl },
        },
        "Last chance — expires tomorrow"
      );
    case "tenant_welcome":
      return render(
        {
          preview: `${data.schoolName ?? "Your school"} is live on EduMyles.`,
          eyebrow: "Welcome",
          heading: `Welcome to EduMyles, ${data.firstName ?? "there"}`,
          intro: `${data.schoolName ?? "Your school"} now has an active EduMyles workspace. Your next step is to continue the school setup wizard and activate your trial once the core steps are complete.`,
          action: { label: "Continue School Setup", href: data.setupUrl ?? defaultSetupUrl },
        },
        `Welcome to EduMyles, ${data.firstName ?? "there"}`
      );
    case "staff_invite":
      return render(
        {
          preview: `Join ${data.schoolName ?? "your school"} on EduMyles as ${data.role ?? "staff"}.`,
          eyebrow: "Staff Invitation",
          heading: `You've been invited to join ${data.schoolName ?? "your school"}`,
          intro: `You have been invited to join EduMyles as ${data.role ?? "staff"}. Accept the invitation to activate your account and enter the correct staff workspace.`,
          sections: [{ title: "Invitation expiry", body: `This invite expires on ${data.expiryDate ?? "soon"}.` }],
          action: { label: "Accept Staff Invitation", href: data.inviteUrl ?? defaultStaffInviteUrl },
        },
        `You've been invited to join ${data.schoolName ?? "your school"} on EduMyles`
      );
    case "parent_invite_email":
      return render(
        {
          preview: `Join ${data.schoolName ?? "your school"} on EduMyles to follow ${data.studentName ?? "your child"}.`,
          eyebrow: "Parent Invitation",
          heading: `Stay connected with ${data.studentName ?? "your child"}`,
          intro: `${data.schoolName ?? "Your school"} has invited you to join EduMyles so you can stay informed about attendance, fees, communication, and progress for ${data.studentName ?? "your child"}.`,
          action: { label: "Join Parent Portal", href: data.joinUrl ?? defaultParentJoinUrl },
        },
        `Join ${data.schoolName ?? "your school"} on EduMyles`
      );
    case "activation_congratulations":
      return render(
        {
          preview: `${data.schoolName ?? "Your school"} has activated its EduMyles trial.`,
          eyebrow: "Activation",
          heading: "Your EduMyles trial is now active",
          intro: `Congratulations, ${data.firstName ?? "there"}. ${data.schoolName ?? "Your school"} has completed enough onboarding progress to activate the EduMyles trial.`,
          sections: [{ title: "Trial window", body: `Your trial is active until ${data.trialEndsAt ?? "soon"}.` }],
          action: { label: "Open Admin Dashboard", href: data.dashboardUrl ?? defaultDashboardUrl },
        },
        "Your EduMyles trial is now active"
      );
    case "trial_day3_checkin":
      return render(
        {
          preview: `How is setup going at ${data.schoolName ?? "your school"}?`,
          eyebrow: "Trial Check-in",
          heading: "How's it going?",
          intro: `${data.schoolName ?? "Your school"} is three days into the EduMyles trial. Keep moving through setup so the school reaches live value early.`,
          action: { label: "Review Trial Progress", href: data.billingUrl ?? defaultBillingUrl },
        },
        "How's it going on EduMyles?"
      );
    case "trial_day7_halfway":
      return render(
        {
          preview: `${data.schoolName ?? "Your school"} is halfway through its EduMyles trial.`,
          eyebrow: "Trial Checkpoint",
          heading: "You're halfway through your trial",
          intro: "This is a good time to review the modules your team is using and line up the right plan.",
          action: { label: "Open Billing & Plans", href: data.billingUrl ?? defaultBillingUrl },
        },
        "You're halfway through your EduMyles trial"
      );
    case "trial_day10_nudge":
      return render(
        {
          preview: `Seven days left in the EduMyles trial for ${data.schoolName ?? "your school"}.`,
          eyebrow: "Trial Reminder",
          heading: "Seven days left in your trial",
          intro: "Choose a plan early to avoid any interruption to non-core module access.",
          action: { label: "Choose a Plan", href: data.billingUrl ?? defaultBillingUrl },
        },
        "Seven days left in your EduMyles trial"
      );
    case "trial_day12_outreach":
      return render(
        {
          preview: `Your EduMyles account manager is ready to help ${data.schoolName ?? "your school"}.`,
          eyebrow: "Account Manager Outreach",
          heading: "Your account manager is ready to help",
          intro: `${data.accountManagerName ?? "Your EduMyles account manager"} is available to help ${data.schoolName ?? "your school"} finish setup, review modules in use, and choose the right plan before trial expiry.`,
          action: { label: "Open Billing & Plans", href: data.billingUrl ?? defaultBillingUrl },
        },
        "Your EduMyles account manager is ready to help"
      );
    case "trial_day13_urgent":
      return render(
        {
          preview: `Tomorrow is the last day of the EduMyles trial for ${data.schoolName ?? "your school"}.`,
          eyebrow: "Urgent Trial Reminder",
          heading: "Tomorrow is your last day",
          intro: `Your trial ends tomorrow. Choose a plan today so ${data.schoolName ?? "your school"} keeps access to the non-core modules your team has already started using.`,
          action: { label: "Choose a Plan Today", href: data.billingUrl ?? defaultBillingUrl },
        },
        "Tomorrow is your last day"
      );
    case "trial_expired":
      return render(
        {
          preview: `${data.schoolName ?? "Your school"}'s EduMyles trial has ended.`,
          eyebrow: "Trial Expired",
          heading: "Your trial has ended",
          intro: `The EduMyles trial for ${data.schoolName ?? "your school"} has ended. Core SIS access is still preserved, but non-core modules may now be suspended until the school activates a paid plan.`,
          action: { label: "Choose a Plan", href: data.billingUrl ?? defaultBillingUrl },
        },
        "Your trial has ended"
      );
    case "subscription_confirmed":
      return render(
        {
          preview: `${data.schoolName ?? "Your school"} is now active on the ${data.planName ?? "selected"} plan.`,
          eyebrow: "Subscription Confirmed",
          heading: "Payment confirmed",
          intro: `${data.schoolName ?? "Your school"} is now active on the ${data.planName ?? "selected"} plan. Your payment of ${data.amountKes ?? "KES 0"} has been recorded successfully.`,
          sections: [{ title: "Next billing date", body: data.nextPaymentDate ?? "TBD" }],
          action: { label: "Open Admin Dashboard", href: data.dashboardUrl ?? defaultDashboardUrl },
        },
        "Payment confirmed"
      );
    case "stalled_onboarding_nudge":
      return render(
        {
          preview: `${data.schoolName ?? "Your school"} has stalled at ${data.currentStepLabel ?? "the current setup step"}.`,
          eyebrow: "Onboarding Nudge",
          heading: "Your onboarding needs a quick push",
          intro: data.message ?? "Your onboarding is waiting on the next setup step.",
          sections: [{ title: "Current step", body: data.currentStepLabel ?? "Current setup step" }],
          action: { label: "Continue Setup", href: data.setupUrl ?? defaultSetupUrl },
        },
        "EduMyles onboarding nudge"
      );
    default:
      return null;
  }
}
