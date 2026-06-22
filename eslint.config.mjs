import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".claude/**",
    ".codex/**",
    ".playwright-cli/**",
    "out/**",
    "output/**",
    "outputs/**",
    "build/**",
    "tmp/**",
    "logs/**",
    "prisma/*.db",
    "prisma/*.db-journal",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
