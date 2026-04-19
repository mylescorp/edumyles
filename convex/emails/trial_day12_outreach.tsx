import * as React from "react";
import { EmailShell } from "./_base";

export type TrialDay12OutreachEmailProps = {
  schoolName: string;
  accountManagerName?: string;
  billingUrl: string;
};

export default function TrialDay12OutreachEmail(props: TrialDay12OutreachEmailProps) {
  return (
    <EmailShell
      preview={`Your EduMyles account manager is ready to help ${props.schoolName}.`}
      eyebrow="Account Manager Outreach"
      heading="Your account manager is ready to help"
      intro={`${props.accountManagerName ?? "Your EduMyles account manager"} is available to help ${props.schoolName} finish setup, review modules in use, and choose the right plan before trial expiry.`}
      action={{ label: "Open Billing & Plans", href: props.billingUrl }}
    />
  );
}
