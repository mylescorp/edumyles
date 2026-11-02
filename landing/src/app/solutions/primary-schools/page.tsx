import type { Metadata } from "next";
import SolutionBoardPage from "@/components/solutions/SolutionBoardPage";

export const metadata: Metadata = {
  title: "EduMyles for Primary Schools — CBC-Ready School Management",
  description: "CBC-ready school management with M-Pesa integration, assessment reporting and parent communication.",
  alternates: { canonical: "/solutions/primary" },
};

export default function PrimarySchoolsPage() {
  return <SolutionBoardPage kind="primary" />;
}
