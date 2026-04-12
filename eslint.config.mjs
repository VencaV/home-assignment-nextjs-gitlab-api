import stylistic from "@stylistic/eslint-plugin";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		plugins: {
			"@stylistic": stylistic,
		},
		rules: {
			curly: "error",
			eqeqeq: "error",
			"no-var": "error",
			"prefer-const": "error",
			"no-throw-literal": "error",
			"no-implicit-coercion": "error",
			"@stylistic/brace-style": "error",
			"@stylistic/indent": ["error", "tab"],
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
	]),
]);

export default eslintConfig;
