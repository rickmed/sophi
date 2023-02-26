import { SOPHI, relPathFromProjectRoot } from "./utils.js"
import { objToSuite, throwDuplicateName } from "./suite.js"

export async function run(absFilePath_s) {

	// ./suite.js should have set globalThis[SOPHI] while imported (above)
	const projectRoot = process.cwd()
	const globSophi = globalThis[SOPHI]
	globSophi.projectRoot = projectRoot

	let suite = {
		duration: {
			collect: undefined,
			tests: undefined,
		},
		oneOrJustUsed: false,
		suites: undefined,
	}

	const fileSuite_s = await collectSuites(absFilePath_s)
	suite.suites = fileSuite_s
	await execTests(suite)
	return suite


	async function collectSuites(absFilePath_s) {

		const startTime = Date.now()

		let fileSuite_s = new Map()
		const {collector} = globSophi

		for (const absfilePath of absFilePath_s) {
			const filePath = relPathFromProjectRoot(absfilePath)

			// for suite.js to throw if duplicate test name in same file
			globSophi.testFilePath = filePath

			const exports = await import(absfilePath)
			let fileSuite = collector.pullSuite()

			if (typeof exports.tests?.addTest !== "function") {
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

		suite.duration.collect = Date.now() - startTime

		return fileSuite_s


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
	}

	async function execTests(suite) {

		const startTime = Date.now()

		for (const [, fileSuite] of suite.suites) {
			for (const [, test] of fileSuite.clusters.runnable) {
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

		suite.duration.tests = Date.now() - startTime
		return suite
	}
}
