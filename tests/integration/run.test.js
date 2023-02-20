import { describe, it, expect } from "vitest"
import { absPathFromRel } from "../utils.js"
import { run } from "../../source/run"
import { buildTestID as ID } from "../../source/suite.js"
import { fn1, fn2, fn3, toSuiteSchema } from "../utils.js"
import { relPathFromProjectRoot } from "../../source/utils.js"

describe("run()", () => {

	it("just() works across files: when two files use it, it should execute only one", async () => {

		let paths = [
			"./fixture.just1.js",
			"./fixture.just2.js",
		]

		const modUrl = import.meta.url

		paths = paths.map(p => absPathFromRel(modUrl, p))

		const rec = await setup(paths)

		const suite = toSuiteSchema({
			runnable: [
				[ID(["a"], "test just 1"), { fn: fn1 }],
			],
			justUsed: true,
			testCount: 1,
		})

		const exp = new Map([
			[absPathFromRel(modUrl, paths[0]), suite],
		])

		expect(rec.suites).toEqual(exp)
	})


	it("works with only obj api", async () => {

		const path = absPathFromRel(import.meta.url, "./fixture.cb_obj.js")
		const rec = await setup([path])

		const suite = toSuiteSchema({
			runnable: [
				[ID(["a"], "test 2"), { fn: fn2 }],
				[ID([], "test 3"), { fn: fn3 }],
			],
			testCount: 2,
		})

		const exp = new Map([
			[path, suite],
		])

		expect(rec.suites).toEqual(exp)
	})


	describe("mixed cb/object api in same file", () => {

		it("are merged correctly in suite", async () => {

			const path = absPathFromRel(import.meta.url, "./fixture.mixed.cb_obj.js")
			const rec = await setup([path])

			const suite = toSuiteSchema({
				runnable: [
					[ID(["a"], "test 1"), { fn: fn1 }],
					[ID(["a"], "test 2"), { fn: fn2 }],
					[ID([], "test 3"), { fn: fn3 }],
				],
				testCount: 3,
			})

			const exp = new Map([
				[path, suite],
			])

			expect(rec.suites).toEqual(exp)
		})
	})


	it("works with async describe/group (pure api)", async () => {

		const path = absPathFromRel(import.meta.url, "./fixture.async_describe.js")
		const rec = await setup([path])

		const suite = toSuiteSchema({
			runnable: [
				[ID(["a"], "test 1"), { fn: fn1 }],
			],
			testCount: 1,
		})

		const exp = new Map([
			[path, suite],
		])

		expect(rec.suites).toEqual(exp)
	})


	describe("throws if duplicate test titles", () => {

		it("cb api", async () => {

			const path = absPathFromRel(import.meta.url, "./fixture.throwDuplicate.js")

			try {
				await setup([path])
			}
			catch (e) {
				const msg = `Duplicate test name "a" ▶ "test" in same file: ` + relPathFromProjectRoot(path)
				expect(e.message).toBe(msg)
			}
		})

		it("mixed cb and obj apis", async () => {

			const path = absPathFromRel(import.meta.url, "./fixture.mixed.cb_obj.throwDuplicate.js")

			try {
				await setup([path])
			}
			catch (e) {
				const msg = `Duplicate test name "a" ▶ "test" in same file: ` + relPathFromProjectRoot(path)
				expect(e.message).toBe(msg)
			}
		})
	})
})


async function setup(testFilePath_s) {
	return await run(testFilePath_s)
}
