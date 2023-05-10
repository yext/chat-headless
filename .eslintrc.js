module.exports = {
  root: true,
  extends: ["@yext/eslint-config/typescript-react"],
  ignorePatterns: [
    "**/lib",
    "**/dist",
    //Temporary: to avoid issue with EslintPluginImportResolveError from Rule: "@yext/export-star/no-duplicate-exports"
    "**/index.ts",
    "**/build",
    "**/coverage",
    "*.d.ts",
  ],
  parserOptions: {
    project: ["tsconfig.json"],
  },
  overrides: [
    {
      files: ["**/*.{test,stories}.*"],
      rules: {
        "react-perf/jsx-no-new-array-as-prop": "off",
        "react-perf/jsx-no-new-function-as-prop": "off",
        "react-perf/jsx-no-new-object-as-prop": "off",
      },
    },
  ],
};
