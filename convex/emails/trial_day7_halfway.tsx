import * as React from "react";
import { EmailShell } from "./_base";

export type TrialDay7HalfwayEmailProps = {
  schoolName: string;
  billingUrl: string;
};

export default function TrialDay7HalfwayEmail(props: TrialDay7HalfwayEmailProps) {
  return (
    <EmailShell
      preview={`${props.schoolName} is halfway through its EduMyles trial.`}
      eyebrow="Trial Checkpoint"
      heading="You're halfway through your trial"
      intro={`Your school is halfway through the EduMyles trial. This is a good time to review the modules your team is using and line up the right plan.`}
      action={{ label: "Open Billing & Plans", href: props.billingUrl }}
    />
  );
}
