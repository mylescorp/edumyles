import * as React from "react";
import { EmailShell } from "./_base";

export type ParentInviteEmailProps = {
  parentName?: string;
  schoolName: string;
  studentName: string;
  joinUrl: string;
};

export default function ParentInviteEmail(props: ParentInviteEmailProps) {
  return (
    <EmailShell
      preview={`Join ${props.schoolName} on EduMyles to follow ${props.studentName}.`}
      eyebrow="Parent Invitation"
      heading={`Stay connected with ${props.studentName}`}
      intro={`${props.schoolName} has invited you to join EduMyles so you can stay informed about attendance, fees, communication, and progress for ${props.studentName}.`}
      action={{ label: "Join Parent Portal", href: props.joinUrl }}
      outro="If your child details do not match what you expect, contact the school office before completing registration."
    />
  );
}
