import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Tenant isolation guard: prevent raw prisma imports in tenant-scoped code
  {
    files: [
      "src/app/api/**/*.ts",
      "src/app/(tenant)/**/*.ts",
      "src/app/(tenant)/**/*.tsx",
    ],
    ignores: [
      "src/app/api/webhooks/**",
      "src/app/api/auth/**",
      "src/app/api/signup/**",
      "src/app/api/admin/**",
      "src/app/api/health/**",
      "src/app/api/social/canva/**",
      "src/app/api/staff/verify-license-token/**",
      "src/app/api/voice/**",
      "src/app/api/billing/**",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@/lib/prisma",
          message: "Do not import the raw prisma client in tenant-scoped routes. Use getTenantPrisma() from '@/lib/tenant/get-tenant-prisma' or withTenant() from '@/lib/tenant/route-wrappers'. This prevents data leaks between tenants.",
        }],
      }],
    },
  },
]);

export default eslintConfig;
