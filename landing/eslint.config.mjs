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
    rules: {
      "edumyles-design-system/no-hardcoded-colors": "error",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];

export default config;
