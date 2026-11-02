import { metadata as primarySchoolsMetadata } from "../primary-schools/page";

export { default } from "../primary-schools/page";
export const metadata = {
  ...primarySchoolsMetadata,
  alternates: { ...primarySchoolsMetadata.alternates, canonical: "/solutions/primary" },
};
