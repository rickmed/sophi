export async function execTests(suite) {

	const startTime = Date.now()

	for (const [, fileSuite] of suite.suites) {

		const {clusters} = fileSuite
		const {runnable} = clusters

		const failed = runnable
		clusters.failed = failed

		delete clusters.runnable

		const passed = new Set()
		clusters.passed = passed

		for (const [testID, testFn] of runnable) {
			try {

				if (testFn.constructor.name === "AsyncFunction") {
					await testFn()
				}
				else {
					testFn()
				}

				passed.add(testID)
				failed.delete(testID)
			}
			catch (err) {
				failed.set(testID, err)
			}
		}
	}

	suite.durations.test = Date.now() - startTime
}
