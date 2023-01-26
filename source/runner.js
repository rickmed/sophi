/*
in:  [{
	fileURL,
	tests: {}
}]
out: [{
	fileURL,
	tests: [{
		title,
		status: TEST_PASSED | TEST_FAILED,
		fn,
		error?
	}]
}]
*/
export function run(srcSuite) {
	const mappedSuite = _collect(srcSuite)
	return runTestFns(mappedSuite)
}


/*
in:  [{
	fileURL,
	tests: {}
}]
out:  [{
	fileURL,
	tests: [{
		title,
		fn
	}]
}]
*/
function _collect(srcSuite) {
	let suite = srcSuite

	for (const srcFileSuite of suite) {

		const tests = []
		const srcTests = srcFileSuite.tests

		for (const srcTestTitle in srcTests) {

			const testFn = srcTests[srcTestTitle]
			const test = _Test(srcTestTitle, testFn)

			if (srcTestTitle.startsWith("// ")) {
				suite = [srcFileSuite]
				srcFileSuite.tests = [test]
				return suite
			}

			tests.push(test)

			//
			function _Test(title, fn) {
				return { title, fn }
			}
		}

		srcFileSuite.tests = tests
	}
	return suite
}

export const TEST_PASSED = "SOPHI_TEST_PASSED"
export const TEST_FAILED = "SOPHI_TEST_FAILED"
/*
out:  [{
	fileURL,
	tests: [{
		title,
		fn
	}]
}]
out: [{
	fileURL,
	tests: [{
		title,
		status,
		fn,
		error?
	}]
}]
*/
function runTestFns(suite) {
	for (const fileSuite of suite) {
		for (const test of fileSuite.tests) {
			try {
				test.fn()
				test.status = TEST_PASSED
			}
			catch (e) {
				test.status = TEST_FAILED
				test.error = e
			}
		}
	}
	return suite
}
