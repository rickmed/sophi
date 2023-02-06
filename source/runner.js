/*
srcSuite:  [{
	file_path: tests/testFile.js,
	file_contents:: str,
	tests: {
		"title name"() {}
	}
}]
out: [{
	inObj...,
	tests: [{
		title,
		fn,
		error?
	}]
}]
*/
export function run(srcSuite) {
	const startTime = Date.now()
	const mappedSuite = collect(srcSuite)
	const suiteResults = runTestFns(mappedSuite)
	const ret = {
		results: suiteResults,
		duration: Date.now() - startTime
	}
	return ret
}


function collect(srcSuite) {
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
		}

		srcFileSuite.tests = tests
	}

	return suite


	function _Test(title, fn) {
		return { title, fn }
	}
}

function runTestFns(suite) {

	for (const fileSuite of suite) {
		for (const test of fileSuite.tests) {
			try {
				test.fn()
			}
			catch (e) {
				test.error = e
			}
		}
	}

	return suite
}
