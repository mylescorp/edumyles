import { PartnerProgramPage, resellerProgram } from "@/components/partners/PartnerProgramPage";
import { publicMetadata, SITE_URL } from "@/lib/seo";

export const metadata = publicMetadata({
  title: "Reseller Program — EduMyles",
  description:
    "Sell, implement, and support EduMyles as a reseller partner. Build recurring revenue serving schools across East Africa.",
  canonical: `${SITE_URL}/reseller`,
});

export default function ResellerPage() {
  return <PartnerProgramPage config={resellerProgram} />;
}
