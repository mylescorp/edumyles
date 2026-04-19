import * as React from "react";
import { EmailShell } from "./_base";

export type WaitlistConfirmationEmailProps = {
  firstName: string;
  schoolName: string;
};

export default function WaitlistConfirmationEmail(props: WaitlistConfirmationEmailProps) {
  return (
    <EmailShell
      preview={`You are on the EduMyles waitlist for ${props.schoolName}.`}
      eyebrow="Waitlist Confirmation"
      heading={`You're on the EduMyles waitlist, ${props.firstName}!`}
      intro={`Thanks for sharing ${props.schoolName} with us. Our platform team will review your school details and reach out with the next step as soon as your onboarding slot is ready.`}
      sections={[
        {
          title: "What to expect next",
          body: "We review qualification details, school size, and rollout readiness before sending an invitation to create your EduMyles workspace.",
        },
        {
          title: "How long it usually takes",
          body: "High-fit schools are typically contacted first. If we need any extra details, we will use the email address or phone number you shared.",
        },
      ]}
      outro="Thanks for your interest in EduMyles. We’re excited to help your school run smoother, faster, and with less admin overhead."
    />
  );
}
