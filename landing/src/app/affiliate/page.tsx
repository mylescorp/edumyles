import { PartnerProgramPage, affiliateProgram } from "@/components/partners/PartnerProgramPage";
import { publicMetadata, SITE_URL } from "@/lib/seo";

export const metadata = publicMetadata({
  title: "Affiliate Program — EduMyles",
  description:
    "Refer schools to EduMyles and earn commission through a tracked affiliate program built for education communities, creators, and consultants.",
  canonical: `${SITE_URL}/affiliate`,
});

export default function AffiliatePage() {
  return <PartnerProgramPage config={affiliateProgram} />;
}
