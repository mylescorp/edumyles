import { metadata as singularMetadata } from "../affiliate/page";

export { default } from "../affiliate/page";
export const metadata = {
  ...singularMetadata,
  alternates: { canonical: "/affiliates" },
};
