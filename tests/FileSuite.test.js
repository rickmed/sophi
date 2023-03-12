import { PassThrough } from "node:stream"
import {
	describe, it,
	group, test,
	check, lossy,
	check_Eq as _check_Eq_,
	run,
} from "../source/index.js"
import { FileSuite, objToSuite } from "../source/FileSuite.js"
import { GLOB_SOPHI_K } from "../source/utils.js"
import { fileSummaryTable } from "../source/report.js"
import { fullTestTitleToStr } from "../source/failTestToStr.js"
import { fn1, fn2, fn3, fn4 } from "./utils.js"


it("simple nested tests", async () => {

	const log = await runTrapLogs(["tests/fixture.nested_testTitles.js"])

	const testTitle1 = fullTestTitleToStr(["a", "aa", "test 2"])
	const testTitle2 = fullTestTitleToStr(["test 5"])

	check(log).satisfies(existsInLog, { str: testTitle1 })
	check(log).satisfies(existsInLog, { str: testTitle2 })
})

describe("modifiers", () => {

	describe("only()", () => {

		it("the rest of tests are ignored", () => {

			globalThis[GLOB_SOPHI_K].fileSuite = new FileSuite()

			group("a", () => {
				test.skip("test 1", () => { })    // ignored
				test.only("test 4", fn1)          // runs
				test.todo("test 3")               // ignored
				test("test 5", () => { })         // ignored
			})

			const rec = globalThis[GLOB_SOPHI_K].fileSuite

			const exp = lossy({
				tests: new Map([[
					1, { ID: 1, name: "test 4", fn: fn1, g: 1 },
				]]),
				onlyUsed: true,
			})

			check(rec).with(exp)
		})
	})

	describe("skip()", () => {

		it("with tests", () => {

			globalThis[GLOB_SOPHI_K].fileSuite = new FileSuite()

			group("a", () => {
				test.skip("test 1", () => { })   // skipped
				test("test 2", fn1)              // runs
			})

			const rec = globalThis[GLOB_SOPHI_K].fileSuite

			const exp = lossy({
				tests: new Map([[
					1, { ID: 1, name: "test 2", fn: fn1, g: 1 },
				]]),
				n_Skip: 1,
			})

			check(rec).with(exp)
		})

		it("with tests inside groups", () => {

			globalThis[GLOB_SOPHI_K].fileSuite = new FileSuite()

			group("a", () => {
				group.skip("aa", () => {
					test("test 1", () => { })        // skip
					test("test 2", () => { })        // skip
				})
				group("aa", () => {
					test("test 3", fn1)              // runs
				})
				test.skip("test 4", () => { })      // skip
			})

			const rec = globalThis[GLOB_SOPHI_K].fileSuite
			const exp = lossy({
				tests: new Map([[
					1, { ID: 1, name: "test 3", fn: fn1, g: 1 },
				]]),
				n_Skip: 3,
			})

			check(rec).with(exp)
		})
	})

	describe("todo()", () => {

		it("not added when inside skip", () => {

			globalThis[GLOB_SOPHI_K].fileSuite = new FileSuite()

			group.skip("a", () => {
				test.todo("test 1")
			})
			test.todo("test 2")

			const rec = globalThis[GLOB_SOPHI_K].fileSuite

			const spec = lossy({
				tests: new Map(),
				n_Todo: 2,
			})

			check(rec).with(spec)
		})
	})
})

describe("object api", () => {

	it.$("works with nesting", () => {

		let tests = {
			a: {
				aa: {
					["test 1"]: fn1,
					["test 2"]: fn2,
				},
				["test 3"]: fn3,
			},
			b: {
				["test 4"]: fn4,
			},
		}

		const rec = objToSuite(tests)

		const exp = lossy({
			tests: new Map([
				[1, { ID: 1, name: "test 1", fn: fn1, g: 1 }],
				[2, { ID: 2, name: "test 2", fn: fn2, g: 1 }],
				[3, { ID: 3, name: "test 3", fn: fn3, g: 2 }],
				[4, { ID: 4, name: "test 4", fn: fn4, g: 3 }],
			]),
		})
console.log(rec.groups)
		check(rec).with(exp)
		check(rec.n_Tests).with(4)
	})
})


async function runTrapLogs(testFiles) {
	const stdout = new PassThrough().setEncoding("utf8")
	let log = ""
	stdout.on("data", x => log += x)
	await run(testFiles, { stdout })
	return log
}


function existsInLog({ str }, log) {
	return log.includes(str)
}
