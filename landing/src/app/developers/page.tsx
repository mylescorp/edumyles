import { PartnerProgramPage, developerProgram } from "@/components/partners/PartnerProgramPage";
import { publicMetadata, SITE_URL } from "@/lib/seo";

export const metadata = publicMetadata({
  title: "Developers — EduMyles Partner Ecosystem",
  description:
    "Build integrations, modules, and implementation services for the EduMyles school management ecosystem.",
  canonical: `${SITE_URL}/developers`,
});

export default function DevelopersPage() {
  return <PartnerProgramPage config={developerProgram} />;
}
