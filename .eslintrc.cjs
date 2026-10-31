module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.3" } },
  plugins: ["react-refresh"],
  rules: {
    "react/jsx-no-target-blank": "off",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "react/prop-types": "off",
    // Apostrophes and quotes are fine in JSX text; still flag the characters that cause real bugs.
    "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
  },
  overrides: [
    {
      // Context providers deliberately export their companion hooks.
      files: ["src/state/*.jsx", "src/components/Stage.jsx", "src/components/Toasts.jsx"],
      rules: { "react-refresh/only-export-components": "off" },
    },
    {
      files: ["scripts/**/*.mjs"],
      env: { node: true, browser: false },
    },
  ],
};
