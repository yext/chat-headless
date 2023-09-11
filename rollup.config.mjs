/**
 * \@rollup/plugin-typescript had issue with "export type":
 * [!] RollupError: Unexpected token (Note that you need plugins to import files that are not JavaScript)
 * Switched over to a fork rollup-plugin-typescript2 resolved the issue.
 */
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import { defineConfig } from "rollup";

/**
 * (for chat-headless-react lib)
 * This is required because only React 18 contains "exports" field point to
 * "react/jsx-runtime.js" file in package.json. The file is backported to
 * React 16 and 17 but wasn't explicitly included in package.json so we need to
 * maps the external module id to the file path with extension.
 * 
 * https://github.com/facebook/react/issues/20235
 */
const externalModulePaths = {
  "react/jsx-dev-runtime": "react/jsx-dev-runtime.js",
  "react/jsx-runtime": "react/jsx-runtime.js",
}

export default defineConfig({
  input: "src/index.ts",
  external: externalModulePaths,
  output: [
    {
      dir: "./dist/esm",
      /**
       * use mjs extension so NodeJS will recognize the bundle as ES modules
       * https://nodejs.org/api/packages.html#determining-module-system
       */
      entryFileNames: "[name].mjs",
      format: "esm",
      /** preserve original module files instead of compressing all to one file */
      preserveModules: true,
      sourcemap: true,
      /**
       * set to "auto" to follow TypeScript's esModuleInterop behavior to ensures compatibility
       * of default, namespace, and dynamic imports from external deps.
       */
      interop: "auto",
    },
    {
      dir: "./dist/commonjs",
      format: "cjs",
      preserveModules: true,
      sourcemap: true,
      interop: "auto",
    },
  ],
  plugins: [
    /** required to resolve import of package.json */
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
});
