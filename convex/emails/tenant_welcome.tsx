import * as React from "react";
import { EmailShell } from "./_base";

export type TenantWelcomeEmailProps = {
  firstName: string;
  schoolName: string;
  setupUrl: string;
};

export default function TenantWelcomeEmail(props: TenantWelcomeEmailProps) {
  return (
    <EmailShell
      preview={`${props.schoolName} is live on EduMyles.`}
      eyebrow="Welcome"
      heading={`Welcome to EduMyles, ${props.firstName}`}
      intro={`${props.schoolName} now has an active EduMyles workspace. Your next step is to continue the school setup wizard and activate your trial once the core steps are complete.`}
      sections={[
        {
          title: "What is ready already",
          body: "Your tenant shell, core modules, onboarding record, and school-admin access have all been provisioned.",
        },
      ]}
      action={{ label: "Continue School Setup", href: props.setupUrl }}
    />
  );
}
