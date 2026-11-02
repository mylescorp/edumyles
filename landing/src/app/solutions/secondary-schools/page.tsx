import type { Metadata } from "next";
import SolutionBoardPage from "@/components/solutions/SolutionBoardPage";

export const metadata: Metadata = {
  title: "EduMyles for Secondary Schools — Timetabling, Academics & Payroll",
  description: "Coordinate secondary school timetables, academics, fees and staff workflows in one platform.",
  alternates: { canonical: "/solutions/secondary" },
};

export default function SecondarySchoolsPage() {
  return <SolutionBoardPage kind="secondary" />;
}
