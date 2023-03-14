import { describe, it, group, test, check, check_Throws } from "../source/index.js"
import { FileSuite, DUPLICATE_GROUP_MSG, objToSuite } from "../source/FileSuite.js"
import { GLOB_SOPHI_K } from "../source/utils.js"
import { fullNameToStr } from "../source/stringifyFailedTests.js"
import { exec_run_withLogTrap, existsInLog, fn1, fn2, fn3, fn4 } from "./utils.js"


describe("nested tests", () => {

	it("simple", async () => {

		const log = await exec_run_withLogTrap(["tests/fixture.nested_testTitles.js"])

		const testTitle1 = fullNameToStr(["a", "aa", "test 2"])
		const testTitle2 = fullNameToStr(["test 5"])

		check(log).satisfies(existsInLog, { str: testTitle1 })
		check(log).satisfies(existsInLog, { str: testTitle2 })
	})

	it("throws if duplicate nested group names", async () => {

		globalThis[GLOB_SOPHI_K].fileSuite = new FileSuite()

		const err = check_Throws(() => {
			group("a", () => {
				group("aa", () => {
					test("test 1", () => {})
				})
				group("aa", () => {
					test("test 2", () => {})
				})
			})
		})

		check(err.message).with(DUPLICATE_GROUP_MSG + fullNameToStr(["a", "aa"]))
	})

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

			const exp_tests = new Map([[
				1, { ID: 1, name: "test 4", fn: fn1, g: 1 },
			]])

			check(rec.tests).with(exp_tests)
			check(rec.onlyUsed).with(true)
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

			const exp_tests = new Map([[
				1, { ID: 1, name: "test 2", fn: fn1, g: 1 },
			]])

			check(rec.tests).with(exp_tests)
			check(rec.n_Skip).with(1)
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

			const exp_tests = new Map([[
				1, { ID: 1, name: "test 3", fn: fn1, g: 1 },
			]])

			check(rec.tests).with(exp_tests)
			check(rec.n_Skip).with(3)
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

			check(rec.tests).with(new Map())
			check(rec.n_Todo).with(2)
		})
	})
})

describe("object api", () => {

	it("works with nesting", () => {

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

		const exp_tests = new Map([
			[1, { ID: 1, name: "test 1", fn: fn1, g: 1 }],
			[2, { ID: 2, name: "test 2", fn: fn2, g: 1 }],
			[3, { ID: 3, name: "test 3", fn: fn3, g: 2 }],
			[4, { ID: 4, name: "test 4", fn: fn4, g: 3 }],
		])

		check(rec.tests).with(exp_tests)
	})
})
