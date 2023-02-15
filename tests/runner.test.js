import { test, expect } from "vitest"
import { run } from "../source/runner.js"

const RUN_FN = "run() > "

test(RUN_FN + "returns Failed correctly", () => {

	const testTitle = "someMethod()"
	const simpleTest = {
		[testTitle]() {
			expect(1).toBe(2)
		},
	}

	const fileURL = "someURL"
	const tests = [
		{
			fileURL,
			tests: simpleTest,
		},
	]

	const { results } = run(tests)

	checkResSchema(results)

	expect(results.length).toBe(1)

	const fileTestsRes = results[0]
	expect(fileTestsRes.fileURL).toBe(fileURL)

	const testsRes = fileTestsRes.tests
	expect(testsRes.length).toBe(1)

	const testRes = testsRes[0]
	expect(testRes.error).toBeDefined()
	expect(testRes.title).toBe(testTitle)
})


test(RUN_FN + "returns Passed correctly", () => {

	const testTitle = "someMethod()"
	const simpleTest = {
		[testTitle]() {
			expect(1).toBe(1)
		},
	}

	const fileURL = "someURL"
	const tests = [
		{
			fileURL,
			tests: simpleTest,
		},
	]

	const { results } = run(tests)

	checkResSchema(results)

	expect(results.length).toBe(1)

	const fileTestsRes = results[0]
	expect(fileTestsRes.fileURL).toBe(fileURL)

	const testsRes = fileTestsRes.tests
	expect(testsRes.length).toBe(1)

	const testRes = testsRes[0]
	expect(testRes.error).toBeUndefined()
	expect(testRes.title).toBe(testTitle)
})


test(RUN_FN + "returns mixed Passed & Failed correctly", () => {

	const testTitle1 = "someMethod()"
	const testTitle2 = "someMethod2()"
	const simpleTests = {
		[testTitle1]() {
			expect(1).toBe(1)
		},
		[testTitle2]() {
			expect(1).toBe(2)
		},
	}

	const fileURL = "someURL"
	const tests = [
		{
			fileURL,
			tests: simpleTests,
		},
	]

	const { results } = run(tests)

	checkResSchema(results)

	expect(results.length).toBe(1)

	const fileTestsRes = results[0]
	expect(fileTestsRes.fileURL).toBe(fileURL)

	const testsRes = fileTestsRes.tests
	expect(testsRes.length).toBe(2)

	const test1Res = testsRes[0]
	expect(test1Res.error).toBeUndefined()
	expect(test1Res.title).toBe(testTitle1)

	const test2Res = testsRes[1]
	expect(test2Res.error).toBeDefined()
	expect(test2Res.title).toBe(testTitle2)
})


test(RUN_FN + `with "only" modifier, returns only one result correctly`, () => {

	const testTitle1 = "// someMethod()"
	const simpleTests1 = {
		[testTitle1]() {
			expect(1).toBe(1)
		},
		testTitle2() {
			expect(1).toBe(2)
		},
	}
	const simpleTests2 = {
		testTitle3() {
			expect(1).toBe(1)
		},
		testTitle4() {
			expect(1).toBe(2)
		},
	}

	const fileURL = "URL1"
	const tests = [
		{
			fileURL,
			tests: simpleTests1,
		},
		{
			fileURL: "URL2",
			tests: simpleTests2,
		},
	]

	const { results } = run(tests)

	checkResSchema(results)

	expect(results.length).toBe(1)

	const fileTestsRes = results[0]
	expect(fileTestsRes.fileURL).toBe(fileURL)

	const testsRes = fileTestsRes.tests
	expect(testsRes.length).toBe(1)

	const test1Res = testsRes[0]
	expect(test1Res.error).toBeUndefined()
	expect(test1Res.title).toBe(testTitle1)
})


test(RUN_FN + "adds tests duration", () => {

	const testTitle = "someMethod()"
	const simpleTest = {
		[testTitle]() {
			expect(1).toBe(2)
		},
	}

	const fileURL = "someURL"
	const tests = [
		{
			fileURL,
			tests: simpleTest,
		},
	]

	const runRes = run(tests, Date)

	expect(typeof runRes.duration).toBe("number")
})


function checkResSchema(runRes) {
	expect(runRes).toBeInstanceOf(Array)

	for (const fileRes of runRes) {
		expect(fileRes.fileURL).toBeTypeOf("string")

		const testsRes = fileRes.tests
		expect(testsRes).toBeInstanceOf(Array)

		for (const testRes of testsRes) {
			expect(testRes.title).toBeTypeOf("string")
		}
	}
}
