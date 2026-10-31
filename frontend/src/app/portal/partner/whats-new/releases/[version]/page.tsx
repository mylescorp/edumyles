import { WhatsNewPage } from "@/components/whats-new/WhatsNewPage";

export default async function Page({ params }: { params: Promise<{ version: string }> }) {
  const { version } = await params;
  return <WhatsNewPage version={version} />;
}
