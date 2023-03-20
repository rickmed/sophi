export async function execTests(suite) {

	const startTime = Date.now()

	for (const [, fileSuite] of suite.fileSuites) {

		for (const [, test] of fileSuite.tests) {

			const testFn = test.fn

			try {
				if (testFn.constructor.name === "AsyncFunction") {
					await testFn()
				}
				else {
					testFn()
				}
			}
			catch (err) {
				fileSuite.testFailed(test, err)
			}
		}
	}

	suite.durations.test = Date.now() - startTime
}
