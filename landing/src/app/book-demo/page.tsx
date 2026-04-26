import type { Metadata } from "next";
import { Suspense } from "react";
import BookDemoContent from "./BookDemoContent";

export const metadata: Metadata = {
  title: "Book a Demo - EduMyles | School Management System",
  description:
    "Schedule a personalized demo of EduMyles school management system and save your request directly into our onboarding pipeline.",
};

export default function BookDemoPage() {
  return (
    <Suspense fallback={null}>
      <BookDemoContent />
    </Suspense>
  );
}
