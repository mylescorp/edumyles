import type { Metadata } from "next";
import SolutionBoardPage from "@/components/solutions/SolutionBoardPage";

export const metadata: Metadata = {
  title: "EduMyles for International Schools — IGCSE & School Management",
  description: "Manage IGCSE and mixed curricula, secure access, and branded school portals with EduMyles.",
  alternates: { canonical: "/solutions/international" },
};

export default function InternationalSchoolsPage() {
  return <SolutionBoardPage kind="international" />;
}
