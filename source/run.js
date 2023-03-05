import path from "node:path"
import { collectSuites } from "./collectSuites.js"
import { execTests } from "./execTests.js"
import { report } from "./report.js"
import { stringifyFailsData } from "./stringifyFailsData.js"


export async function run(filePath_s, projectRoot = process.cwd()) {

	let suite = Suite(projectRoot)

	await collectSuites(suite, filePath_s)
	await execTests(suite)
	await stringifyFailsData(suite)
	report(suite)
}

export function Suite(projectRoot = process.cwd()) {
	return {
		durations: {},
		oneOrJustUsed: false,
		suites: undefined,
		absPathFromProjRootDir(filePath) {
			return path.join(projectRoot, filePath)
		},
	}
}
