import type { Metadata } from "next";
import { Suspense } from "react";
import BookDemoContent from "./BookDemoContent";

export const metadata: Metadata = {
  title: "Book a Live Demo - EduMyles | School Management System",
  description:
    "Book a live EduMyles walkthrough for your school. Submit your school details, choose an available time, and sync the confirmed meeting into our demo pipeline.",
  alternates: {
    canonical: "/book-demo",
  },
  openGraph: {
    title: "Book a Live EduMyles Demo",
    description:
      "Submit your school details, choose an available time, and get a practical walkthrough of EduMyles for your team.",
    url: "/book-demo",
  },
};

export default function BookDemoPage() {
  return (
    <Suspense fallback={null}>
      <BookDemoContent />
    </Suspense>
  );
}
