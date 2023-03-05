import { SOPHI } from "./utils.js"
import { objToSuite, throwDuplicateName } from "./suite.js"


export async function collectSuites(suite, filePath_s) {

	const startTime = Date.now()

	let fileSuite_s = new Map()

	// ./suite.js should have set globalThis[SOPHI] while imported (above)
	const {suite: globSuite} = globalThis[SOPHI]

	for (const filePath of filePath_s) {

		// for suite.js to throw if duplicate test name in same file
		globSuite.testFilePath = filePath

		const absFilePath = suite.absPathFromProjRootDir(filePath)

		const exports = await import(absFilePath)
		let fileSuite = globSuite.pullSuite()

		if (exports.tests && typeof exports.tests.addTest !== "function") {
			const objAPI_suite = objToSuite(exports.tests)
			mergeIntoCBSuite(objAPI_suite, fileSuite, filePath)
		}

		const fileSuiteOneOrJustUsed = fileSuite.oneOrJustUsed

		delete fileSuite.oneOrJustUsed

		if (fileSuiteOneOrJustUsed === "one") {

			suite.oneOrJustUsed = "one"

			fileSuite_s = new Map([
				[filePath, fileSuite],
			])

			break
		}

		if (suite.oneOrJustUsed === "just") {
			if (fileSuiteOneOrJustUsed === false) {
				continue
			}
			else {  // fileSuiteOneOrJustUsed === "just"
				fileSuite_s.set(filePath, fileSuite)
				continue
			}
		}

		if (fileSuiteOneOrJustUsed === "just") {

			fileSuite_s = new Map([
				[filePath, fileSuite],
			])

			suite.oneOrJustUsed = "just"
			continue
		}

		fileSuite_s.set(filePath, fileSuite)
	}

	suite.durations.collect = Date.now() - startTime

	suite.suites = fileSuite_s
}


function mergeIntoCBSuite(objAPI_suite, CB_suite, filePath) {

	const {clusters: {runnable}, n_Tests} = objAPI_suite
	const CB_clusters = CB_suite.clusters

	for (const [testID, test] of runnable) {
		if (isInSuite(CB_clusters, testID)) {
			throwDuplicateName(testID, filePath)
		}
		CB_clusters.runnable.set(testID, test)
	}

	CB_suite.n_Tests = CB_suite.n_Tests + n_Tests


	function isInSuite(clusters, testID) {
		for (const cluster of Object.values(clusters)) {
			if (cluster.has(testID)) return true
		}
		return false
	}
}
