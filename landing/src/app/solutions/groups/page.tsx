import { metadata as schoolGroupsMetadata } from "../school-groups/page";

export { default } from "../school-groups/page";
export const metadata = {
  ...schoolGroupsMetadata,
  alternates: { ...schoolGroupsMetadata.alternates, canonical: "/solutions/groups" },
};
