import * as React from "react";
import { EmailShell } from "./_base";

export type TrialDay10NudgeEmailProps = {
  schoolName: string;
  billingUrl: string;
};

export default function TrialDay10NudgeEmail(props: TrialDay10NudgeEmailProps) {
  return (
    <EmailShell
      preview={`Seven days left in the EduMyles trial for ${props.schoolName}.`}
      eyebrow="Trial Reminder"
      heading="Seven days left in your trial"
      intro={`Your school has seven days left in the EduMyles trial. Choose a plan early to avoid any interruption to non-core module access.`}
      action={{ label: "Choose a Plan", href: props.billingUrl }}
    />
  );
}
