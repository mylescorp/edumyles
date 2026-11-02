import type { Metadata } from "next";
import SolutionBoardPage from "@/components/solutions/SolutionBoardPage";

export const metadata: Metadata = {
  title: "EduMyles for School Groups — Multi-Campus Management",
  description: "Manage campuses with separate school controls and consolidated group reporting.",
  alternates: { canonical: "/solutions/groups" },
};

export default function SchoolGroupsPage() {
  return <SolutionBoardPage kind="groups" />;
}
