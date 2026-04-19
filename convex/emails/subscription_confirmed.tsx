import * as React from "react";
import { EmailShell } from "./_base";

export type SubscriptionConfirmedEmailProps = {
  schoolName: string;
  planName: string;
  amountKes: string;
  nextPaymentDate: string;
  receiptUrl?: string;
  dashboardUrl: string;
};

export default function SubscriptionConfirmedEmail(props: SubscriptionConfirmedEmailProps) {
  return (
    <EmailShell
      preview={`${props.schoolName} is now active on the ${props.planName} plan.`}
      eyebrow="Subscription Confirmed"
      heading="Payment confirmed"
      intro={`${props.schoolName} is now active on the ${props.planName} plan. Your payment of ${props.amountKes} has been recorded successfully.`}
      sections={[
        { title: "Next billing date", body: props.nextPaymentDate },
        ...(props.receiptUrl ? [{ title: "Receipt", body: props.receiptUrl }] : []),
      ]}
      action={{ label: "Open Admin Dashboard", href: props.dashboardUrl }}
    />
  );
}
