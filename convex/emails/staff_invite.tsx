import * as React from "react";
import { EmailShell } from "./_base";

export type StaffInviteEmailProps = {
  firstName: string;
  schoolName: string;
  role: string;
  inviteUrl: string;
  expiryDate: string;
};

export default function StaffInviteEmail(props: StaffInviteEmailProps) {
  return (
    <EmailShell
      preview={`Join ${props.schoolName} on EduMyles as ${props.role}.`}
      eyebrow="Staff Invitation"
      heading={`You've been invited to join ${props.schoolName}`}
      intro={`You have been invited to join EduMyles as ${props.role}. Accept the invitation to activate your account and enter the correct staff workspace.`}
      sections={[{ title: "Invitation expiry", body: `This invite expires on ${props.expiryDate}.` }]}
      action={{ label: "Accept Staff Invitation", href: props.inviteUrl }}
    />
  );
}
