import * as React from "react";
import { EmailShell } from "./_base";

export type TrialDay13UrgentEmailProps = {
  schoolName: string;
  billingUrl: string;
};

export default function TrialDay13UrgentEmail(props: TrialDay13UrgentEmailProps) {
  return (
    <EmailShell
      preview={`Tomorrow is the last day of the EduMyles trial for ${props.schoolName}.`}
      eyebrow="Urgent Trial Reminder"
      heading="Tomorrow is your last day"
      intro={`Your trial ends tomorrow. Choose a plan today so ${props.schoolName} keeps access to the non-core modules your team has already started using.`}
      action={{ label: "Choose a Plan Today", href: props.billingUrl }}
    />
  );
}
