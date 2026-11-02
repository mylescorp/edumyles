import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import noHardcodedColors from "../scripts/eslint-rules/no-hardcoded-colors.mjs";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      "edumyles-design-system": { rules: { "no-hardcoded-colors": noHardcodedColors } },
    },
    ignores: [
      "convex/_generated/**",
      "src/convex/_generated/**",
      "eslint-report.json",
      "lint-frontend.json",
      "lint-landing.json",
    ],
    rules: {
      "edumyles-design-system/no-hardcoded-colors": "error",
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
