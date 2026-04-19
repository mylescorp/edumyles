import * as React from "react";
import { EmailShell } from "./_base";

export type TrialDay3CheckinEmailProps = {
  schoolName: string;
  billingUrl: string;
};

export default function TrialDay3CheckinEmail(props: TrialDay3CheckinEmailProps) {
  return (
    <EmailShell
      preview={`How is setup going at ${props.schoolName}?`}
      eyebrow="Trial Check-in"
      heading="How's it going?"
      intro={`${props.schoolName} is three days into the EduMyles trial. Keep moving through setup so the school reaches live value early.`}
      action={{ label: "Review Trial Progress", href: props.billingUrl }}
    />
  );
}
