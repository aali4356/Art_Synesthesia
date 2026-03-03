import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // CORE-07: Ban Math.random() in rendering and pipeline code
  {
    files: ["src/lib/render/**/*.{ts,tsx}", "src/lib/pipeline/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'MemberExpression[object.name="Math"][property.name="random"]',
          message:
            "Math.random() is banned in rendering and pipeline code. Use createPRNG() from @/lib/engine/prng instead.",
        },
      ],
    },
  },
]);

export default eslintConfig;
