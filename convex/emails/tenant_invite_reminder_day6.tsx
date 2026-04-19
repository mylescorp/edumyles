import * as React from "react";
import { EmailShell } from "./_base";

export type TenantInviteReminderDay6EmailProps = {
  firstName: string;
  schoolName: string;
  inviteUrl: string;
  expiryDate: string;
};

export default function TenantInviteReminderDay6Email(props: TenantInviteReminderDay6EmailProps) {
  return (
    <EmailShell
      preview={`Last chance: your EduMyles invitation for ${props.schoolName} expires tomorrow.`}
      eyebrow="Urgent Reminder"
      heading="Last chance — expires tomorrow"
      intro={`This is your final reminder to accept the EduMyles invitation for ${props.schoolName}. The current link expires on ${props.expiryDate}.`}
      sections={[
        {
          title: "Why this matters",
          body: "Once accepted, you’ll land in your live school-admin environment and start the shared 12-step onboarding flow immediately.",
        },
      ]}
      action={{ label: "Accept Invitation Now", href: props.inviteUrl }}
    />
  );
}
