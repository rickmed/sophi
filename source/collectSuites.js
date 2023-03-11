import { GLOB_SOPHI_K } from "./utils.js"
import { objToSuite } from "./FileSuite.js"
import { FileSuite } from "./FileSuite.js"


export async function collectSuites(suite, filePath_s) {

	const startTime = Date.now()

	let fileSuites = new Map()

	let globalSophi = {fileSuite: undefined}
	globalThis[GLOB_SOPHI_K] = globalSophi

	for (const filePath of filePath_s) {

		const absFilePath = suite.absPathFromProjRootDir(filePath)

		globalSophi.fileSuite = new FileSuite()
		const exports = await import(absFilePath)
		let fileSuite = globalSophi.fileSuite

		if (exports.tests) {
			fileSuite = objToSuite(exports.tests)
		}

		if (fileSuite.onlyUsed) {

			suite.onlyUsed = true

			fileSuites = new Map([
				[filePath, fileSuite],
			])

			break
		}

		fileSuites.set(filePath, fileSuite)
	}

	suite.durations.collect = Date.now() - startTime

	suite.fileSuites = fileSuites
}
