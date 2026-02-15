import js from "@eslint/js";
import importX from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

export default [
  { ignores: [".next/**", "node_modules/**", "out/**", "public/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: { module: "writable", require: "readonly", __dirname: "readonly", process: "readonly" },
    },
  },
  {
    plugins: { "import-x": importX },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXAttribute[name.name='style'] ObjectExpression Property[key.name=/color|background|border/i] Literal",
          message: "Hardcoded color values are not allowed. Use CSS variables or Tailwind classes.",
        },
        {
          selector: "JSXAttribute[name.name='style'] ObjectExpression Property[key.name=/margin|padding|gap|top|bottom|left|right|width|height/i] Literal",
          message: "Hardcoded spacing values are not allowed. Use Tailwind spacing classes.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
