import * as React from "react";
import { EmailShell } from "./_base";

export type TenantInviteEmailProps = {
  firstName: string;
  schoolName: string;
  inviteUrl: string;
  expiryDate: string;
  personalMessage?: string;
};

export default function TenantInviteEmail(props: TenantInviteEmailProps) {
  return (
    <EmailShell
      preview={`Your EduMyles invitation for ${props.schoolName} is ready.`}
      eyebrow="Tenant Invitation"
      heading={`Your EduMyles invitation is ready, ${props.firstName}!`}
      intro={`You’ve been invited to create the school-admin workspace for ${props.schoolName}. Use the secure link below to create your admin account and begin the 12-step school setup flow.`}
      sections={[
        ...(props.personalMessage ? [{ title: "Personal note", body: props.personalMessage }] : []),
        {
          title: "Included in your invitation",
          body: "Core SIS access, onboarding wizard, trial-ready module setup, and the live school-admin environment.",
        },
        {
          title: "Invitation expiry",
          body: `This invitation stays active until ${props.expiryDate}. If it expires, the platform team can send you a fresh link.`,
        },
      ]}
      action={{ label: "Create My School Admin Account", href: props.inviteUrl }}
      outro="If you already have an EduMyles account, you can sign in instead and complete the invite from the same organization context."
    />
  );
}
