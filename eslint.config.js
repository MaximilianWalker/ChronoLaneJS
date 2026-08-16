import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "coverage/**",
            "dist/**",
            "examples/**/.next/**",
            "examples/**/dist/**",
            "node_modules/**",
            "site-dist/**",
            "src/core/localeLoaders.generated.ts",
            "storybook-static/**"
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: ["**/*.{ts,tsx}"]
    })),
    reactHooks.configs.flat.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parserOptions: {
                project: [
                    "./tsconfig.json",
                    "./examples/next/tsconfig.json",
                    "./examples/vite/tsconfig.json",
                    "./tsconfig.site.json",
                    "./tsconfig.storybook.json"
                ],
                tsconfigRootDir: import.meta.dirname,
                sourceType: "module"
            }
        },
        plugins: {
            "react-refresh": reactRefresh
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "react-hooks/preserve-manual-memoization": "off",
            "react-refresh/only-export-components": ["warn", {
                "allowConstantExport": true
            }]
        }
    },
    {
        files: ["test/**/*.test.ts"],
        rules: {
            "@typescript-eslint/no-floating-promises": "off"
        }
    },
    storybook.configs["flat/recommended"]
);
