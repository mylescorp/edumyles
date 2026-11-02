import { metadata as secondarySchoolsMetadata } from "../secondary-schools/page";

export { default } from "../secondary-schools/page";
export const metadata = {
  ...secondarySchoolsMetadata,
  alternates: { ...secondarySchoolsMetadata.alternates, canonical: "/solutions/secondary" },
};
