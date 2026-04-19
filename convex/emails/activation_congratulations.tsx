import * as React from "react";
import { EmailShell } from "./_base";

export type ActivationCongratulationsEmailProps = {
  firstName: string;
  schoolName: string;
  trialEndsAt: string;
  dashboardUrl: string;
};

export default function ActivationCongratulationsEmail(
  props: ActivationCongratulationsEmailProps
) {
  return (
    <EmailShell
      preview={`${props.schoolName} has activated its EduMyles trial.`}
      eyebrow="Activation"
      heading="Your EduMyles trial is now active"
      intro={`Congratulations, ${props.firstName}. ${props.schoolName} has completed enough onboarding progress to activate the EduMyles trial.`}
      sections={[
        {
          title: "Trial window",
          body: `Your trial is active until ${props.trialEndsAt}. Continue inviting staff, students, and parents so your school gets full value during the trial window.`,
        },
      ]}
      action={{ label: "Open Admin Dashboard", href: props.dashboardUrl }}
    />
  );
}
