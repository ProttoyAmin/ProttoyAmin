import next from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...next,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".data/**",
      "out/**",
      "next-env.d.ts",
      "coverage/**",
      "public/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
    },
  },
];

export default eslintConfig;
