import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		exclude: [...configDefaults.exclude, "e2e/**"],
		coverage: {
			provider: "v8",
			include: ["lib/**/*.ts"],
			exclude: ["lib/**/*.test.ts", "lib/get-access-data.ts"],
			thresholds: {
				statements: 100,
				branches: 100,
				functions: 100,
				lines: 100,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "."),
		},
	},
});
