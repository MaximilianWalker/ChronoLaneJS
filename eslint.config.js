import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
    {
        ignores: [
            "coverage/**",
            "dist/**",
            "node_modules/**",
            "src/core/locale-loaders.generated.js"
        ]
    },
    js.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
        files: ["**/*.{js,jsx,mjs}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },
                sourceType: "module"
            }
        },
        plugins: {
            "react-refresh": reactRefresh
        },
        rules: {
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "react-refresh/only-export-components": ["warn", {
                "allowConstantExport": true
            }]
        }
    }
];
