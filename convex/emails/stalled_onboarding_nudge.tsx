import * as React from "react";
import { EmailShell } from "./_base";

export type StalledOnboardingNudgeEmailProps = {
  schoolName: string;
  currentStepLabel: string;
  message: string;
  setupUrl: string;
};

export default function StalledOnboardingNudgeEmail(props: StalledOnboardingNudgeEmailProps) {
  return (
    <EmailShell
      preview={`${props.schoolName} has stalled at ${props.currentStepLabel}.`}
      eyebrow="Onboarding Nudge"
      heading="Your onboarding needs a quick push"
      intro={props.message}
      sections={[{ title: "Current step", body: props.currentStepLabel }]}
      action={{ label: "Continue Setup", href: props.setupUrl }}
    />
  );
}
