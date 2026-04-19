import * as React from "react";
import { EmailShell } from "./_base";

export type TenantInviteReminderDay3EmailProps = {
  firstName: string;
  schoolName: string;
  inviteUrl: string;
  expiryDate: string;
};

export default function TenantInviteReminderDay3Email(props: TenantInviteReminderDay3EmailProps) {
  return (
    <EmailShell
      preview={`Your EduMyles invitation for ${props.schoolName} expires in 4 days.`}
      eyebrow="Invite Reminder"
      heading="Your invitation expires in 4 days"
      intro={`Your EduMyles setup invitation for ${props.schoolName} is still waiting for you. Finish account creation before ${props.expiryDate} so the school can start onboarding without delay.`}
      action={{ label: "Resume Invitation", href: props.inviteUrl }}
      outro="If you need a new invitation or want help choosing the right plan, reply to this message and our team will help."
    />
  );
}
