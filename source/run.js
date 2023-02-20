import { SOPHI } from "./utils.js"
import { objToSuite, throwDuplicateName, Suite } from "./suite.js"

export async function run(testFilePath_s) {

	// ./suite.js should have set globalThis[SOPHI] while imported
	const globSophi = globalThis[SOPHI]
	globSophi.projectRoot = process.cwd()

	const suites = await collectTests(testFilePath_s)
	return await execTests(suites)


	async function collectTests(testFilePath_s) {

		const suites = new Map()

		const {collector} = globSophi

		for (const filePath of testFilePath_s) {

			// used in suite.js -> throwDuplicateName
			globSophi.testFilePath = filePath

			// collects tests while file is evaluated (imported)
			const exports = await import(filePath)
			let fileSuite = collector.pullSuite()

			if (exports.tests?.constructor === Suite) {
				fileSuite = exports.tests.suite
			}

			if (fileSuite.justUsed) {
				suites.set(filePath, fileSuite)
				return suites
			}

			if (typeof exports.tests?.addTest !== "function") {
				const objAPI_suite = objToSuite(exports.tests)
				mergeIntoCBSuite(objAPI_suite, fileSuite, filePath)
			}

			suites.set(filePath, fileSuite)
		}

		return suites


		function mergeIntoCBSuite(objAPI_suite, CB_suite, filePath) {

			const {clusters: {runnable}, testCount} = objAPI_suite
			const CB_clusters = CB_suite.clusters

			for (const [testID, test] of runnable) {
				if (isInSuite(CB_clusters, testID)) {
					throwDuplicateName(testID, filePath)
				}
				CB_clusters.runnable.set(testID, test)
			}

			CB_suite.testCount = CB_suite.testCount + testCount


			function isInSuite(clusters, testID) {
				for (const cluster of Object.values(clusters)) {
					if (cluster.has(testID)) return true
				}
				return false
			}
		}
	}

	async function execTests(suites) {
		const startTime = Date.now()

		for (const [, suite] of suites) {
			for (const [, test] of suite.clusters.runnable) {
				try {
					const {fn} = test
					if (fn.constructor.name === "AsyncFunction") {
						await fn()
					}
					else {
						fn()
					}
				}
				catch (e) {
					test.error = e
				}
			}
		}

		return {
			suites,
			duration: Date.now() - startTime,
		}
	}
}
