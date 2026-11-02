import { metadata as internationalSchoolsMetadata } from "../international-schools/page";

export { default } from "../international-schools/page";
export const metadata = {
  ...internationalSchoolsMetadata,
  alternates: { ...internationalSchoolsMetadata.alternates, canonical: "/solutions/international" },
};
