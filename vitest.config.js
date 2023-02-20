import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		forceRerunTriggers: [...configDefaults.forceRerunTriggers, "**/*.fixture.*"],
		coverage: {
			provider: "istanbul",
		},
		setupFiles: ["tests/vitest-setup-file.js"],
		reporters: "dot",
	},
})
