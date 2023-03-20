import path from "node:path"
import { collectSuites } from "./collectSuites.mjs"
import { execTests } from "./execTests.mjs"
import { report } from "./report.mjs"
import { stringifyFailedTests } from "./stringifyFailedTests.mjs"


export async function _run(filePath_s, opts) {

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
