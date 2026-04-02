import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "convex/_generated/**",
      "src/convex/_generated/**",
      "eslint-report.json",
      "lint-frontend.json",
      "lint-landing.json",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "warn",
    },
  },
];

export default config;
