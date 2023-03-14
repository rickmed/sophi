import path from "node:path"
import { collectSuites } from "./collectSuites.js"
import { execTests } from "./execTests.js"
import { report } from "./report.js"
import { stringifyFailedTests } from "./stringifyFailedTests.js"


export async function run(filePath_s, opts) {

	let suite = newSuite(opts)

	await collectSuites(suite, filePath_s)
	await execTests(suite, opts)
	await stringifyFailedTests(suite)
	report(suite, opts)
}

export function newSuite({projectRoot = process.cwd()} = {}) {
	return {
		durations: {},
		absPathFromProjRootDir(filePath) {
			return path.join(projectRoot, filePath)
		},
	}
}
