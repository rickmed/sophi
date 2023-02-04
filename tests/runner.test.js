import { describe, it, expect } from "vitest"
import { run, TEST_PASSED, TEST_FAILED } from "../source/runner.js"

function _checkResSchema(runRes) {
	expect(runRes).toBeInstanceOf(Array)

	for (const fileRes of runRes) {
		expect(fileRes.fileURL).toBeTypeOf("string")

		const testsRes = fileRes.tests
		expect(testsRes).toBeInstanceOf(Array)

		for (const testRes of testsRes) {
			expect(testRes.title).toBeTypeOf("string")

			const { status } = testRes
			if (status === TEST_FAILED) {
				expect(testRes.error).toBeTypeOf("object")
			}
			else {
				expect(status).toBe(TEST_PASSED)
			}
		}
	}

}

describe("run()", () => {

	it("returns Failed correctly", () => {

		const testTitle = "someMethod()"
		const simpleTest = {
			[testTitle]() {
				expect(1).toBe(2)
			}
		}

		const fileURL = "someURL"
		const tests = [
			{
				fileURL,
				tests: simpleTest
			}
		]

		const runRes = run(tests)

		_checkResSchema(runRes)

		expect(runRes.length).toBe(1)

		const fileTestsRes = runRes[0]
		expect(fileTestsRes.fileURL).toBe(fileURL)

		const testsRes = fileTestsRes.tests
		expect(testsRes.length).toBe(1)

		const testRes = testsRes[0]
		expect(testRes.status).toBe(TEST_FAILED)
		expect(testRes.title).toBe(testTitle)
	})

	it("returns Passed correctly", () => {

		const testTitle = "someMethod()"
		const simpleTest = {
			[testTitle]() {
				expect(1).toBe(1)
			}
		}

		const fileURL = "someURL"
		const tests = [
			{
				fileURL,
				tests: simpleTest
			}
		]

		const runRes = run(tests)

		_checkResSchema(runRes)

		expect(runRes.length).toBe(1)

		const fileTestsRes = runRes[0]
		expect(fileTestsRes.fileURL).toBe(fileURL)

		const testsRes = fileTestsRes.tests
		expect(testsRes.length).toBe(1)

		const testRes = testsRes[0]
		expect(testRes.status).toBe(TEST_PASSED)
		expect(testRes.title).toBe(testTitle)
	})

	it("returns mixed Passed & Failed correctly", () => {

		const testTitle1 = "someMethod()"
		const testTitle2 = "someMethod2()"
		const simpleTests = {
			[testTitle1]() {
				expect(1).toBe(1)
			},
			[testTitle2]() {
				expect(1).toBe(2)
			}
		}

		const fileURL = "someURL"
		const tests = [
			{
				fileURL,
				tests: simpleTests
			}
		]

		const runRes = run(tests)

		_checkResSchema(runRes)

		expect(runRes.length).toBe(1)

		const fileTestsRes = runRes[0]
		expect(fileTestsRes.fileURL).toBe(fileURL)

		const testsRes = fileTestsRes.tests
		expect(testsRes.length).toBe(2)

		const test1Res = testsRes[0]
		expect(test1Res.status).toBe(TEST_PASSED)
		expect(test1Res.title).toBe(testTitle1)

		const test2Res = testsRes[1]
		expect(test2Res.status).toBe(TEST_FAILED)
		expect(test2Res.title).toBe(testTitle2)
	})

	describe(`"only" modifier`, () => {

		it("returns only one result correctly", () => {

			const testTitle1 = "// someMethod()"
			const simpleTests1 = {
				[testTitle1]() {
					expect(1).toBe(1)
				},
				testTitle2() {
					expect(1).toBe(2)
				}
			}
			const simpleTests2 = {
				testTitle3() {
					expect(1).toBe(1)
				},
				testTitle4() {
					expect(1).toBe(2)
				}
			}

			const fileURL = "URL1"
			const tests = [
				{
					fileURL,
					tests: simpleTests1
				},
				{
					fileURL: "URL2",
					tests: simpleTests2
				}
			]

			const runRes = run(tests)

			_checkResSchema(runRes)

			expect(runRes.length).toBe(1)

			const fileTestsRes = runRes[0]
			expect(fileTestsRes.fileURL).toBe(fileURL)

			const testsRes = fileTestsRes.tests
			expect(testsRes.length).toBe(1)

			const test1Res = testsRes[0]
			expect(test1Res.status).toBe(TEST_PASSED)
			expect(test1Res.title).toBe(testTitle1)
		})

	})

})
