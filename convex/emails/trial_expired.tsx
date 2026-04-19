import * as React from "react";
import { EmailShell } from "./_base";

export type TrialExpiredEmailProps = {
  schoolName: string;
  billingUrl: string;
};

export default function TrialExpiredEmail(props: TrialExpiredEmailProps) {
  return (
    <EmailShell
      preview={`${props.schoolName}'s EduMyles trial has ended.`}
      eyebrow="Trial Expired"
      heading="Your trial has ended"
      intro={`The EduMyles trial for ${props.schoolName} has ended. Core SIS access is still preserved, but non-core modules may now be suspended until the school activates a paid plan.`}
      sections={[
        {
          title: "What stays available",
          body: "Core tenant records and student information remain preserved so your school can reactivate without data loss.",
        },
      ]}
      action={{ label: "Choose a Plan", href: props.billingUrl }}
    />
  );
}
