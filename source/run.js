import path from "node:path"
import { collectSuites } from "./collectSuites.js"
import { execTests } from "./execTests.js"
import { report } from "./report.js"
import { stringifyFailsData } from "./stringifyFailsData.js"


export async function run(filePath_s, opts) {

	let suite = Suite(opts)

	await collectSuites(suite, filePath_s)
	await execTests(suite, opts)
	await stringifyFailsData(suite)
	report(suite)
}

export function Suite({projectRoot = process.cwd()} = {}) {
	return {
		durations: {},
		absPathFromProjRootDir(filePath) {
			return path.join(projectRoot, filePath)
		},
	}
}
