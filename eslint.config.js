import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "test-results/**", "coverage/**", "playwright-report/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Worker + shared code runs in workerd, not Node.
  {
    files: ["src/worker/**/*.ts", "src/shared/**/*.ts"],
    languageOptions: {
      globals: { ...globals.worker },
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // Local operator scripts. These are run by hand, not served to a browser, and
  // printing what they did is their entire output — so `console.log` is the
  // interface here and blocking it would only push diagnostics into silence.
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },

  // Browser code: React 19 rules. No console.log anywhere.
  {
    files: ["src/client/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // Tests: allow console for diagnostics in test harness only.
  {
    files: ["test/**/*.ts", "**/*.test.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
      // Tests prove a validator REFUSES a field, which means deliberately
      // dropping it with a rest destructure. The omitted sibling is the point.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
    },
  },
);
