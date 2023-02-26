import { theFunction, group, test, check_is, check_Eq, check_ThrowsAsync } from "../../source/index.js"
import { absPathFromRel } from "../utils.js"
import { run } from "../../source/run.js"
import { buildTestID as ID } from "../../source/suite.js"
import { fn1, fn2, fn3, toFileSuiteSchema } from "../utils.js"
import { relPathFromProjectRoot } from "../../source/utils.js"

theFunction("run()", () => {

	test("one() works across files: it should select only the files that use it", async () => {

		let fixts = [
			"./fixture.one.js",
			"./fixture.noOneOrJust.js",
		]

		fixts = fixts.map(p => absPathFromRel(import.meta.url, p))

		const suite = await setup(fixts)

		const expectedSuite = toFileSuiteSchema({
			runnable: [
				[ID(["b"], "test b"), { fn: fn1 }],
			],
			n_Tests: 1,
		})

		delete expectedSuite.oneOrJustUsed

		const expSuites = new Map([
			[relToProjectRoot("./fixture.one.js"), expectedSuite],
		])

		check_is(suite.oneOrJustUsed, "one")
		check_Eq(suite.suites, expSuites)
	})

	test("just() works across files: only the files that used just are selected", async () => {

		let fixts = [
			"./fixture.just1.js",
			"./fixture.noOneOrJust.js",
			"./fixture.just2.js",
		]

		fixts = fixts.map(p => absPathFromRel(import.meta.url, p))

		const suite = await setup(fixts)

		const fileSuite_just1 = toFileSuiteSchema({
			runnable: [
				[ID(["b"], "test b"), { fn: fn1 }],
			],
			n_Tests: 1,
		})

		delete fileSuite_just1.oneOrJustUsed

		const fileSuite_just2 = toFileSuiteSchema({
			runnable: [
				[ID(["g"], "test g"), { fn: fn1 }],
			],
			n_Tests: 1,
		})

		delete fileSuite_just2.oneOrJustUsed

		const paths = ["./fixture.just1.js", "./fixture.just2.js"]
			.map(relToProjectRoot)

		const expSuites = new Map([
			[paths[0], fileSuite_just1],
			[paths[1], fileSuite_just2],
		])

		check_is(suite.oneOrJustUsed, "just")
		check_Eq(suite.suites, expSuites)
	})

	test("works with only obj api", async () => {

		const path = absPathFromRel(import.meta.url, "./fixture.cb_obj.js")
		const rec = await setup([path])

		const expectedSuite = toFileSuiteSchema({
			runnable: [
				[ID(["a"], "test 2"), { fn: fn2 }],
				[ID([], "test 3"), { fn: fn3 }],
			],
			n_Tests: 2,
		})

		delete expectedSuite.oneOrJustUsed

		const exp = new Map([
			[relToProjectRoot(path), expectedSuite],
		])

		check_Eq(rec.suites, exp)
	})

	group("mixed cb/object api in same file", () => {

		test("are merged correctly in suite", async () => {

			const path = absPathFromRel(import.meta.url, "./fixture.mixed.cb_obj.js")
			const rec = await setup([path])

			const expectedSuite = toFileSuiteSchema({
				runnable: [
					[ID(["a"], "test 1"), { fn: fn1 }],
					[ID(["a"], "test 2"), { fn: fn2 }],
					[ID([], "test 3"), { fn: fn3 }],
				],
				n_Tests: 3,
			})

			delete expectedSuite.oneOrJustUsed

			const exp = new Map([
				[relToProjectRoot(path), expectedSuite],
			])

			check_Eq(rec.suites, exp)
		})
	})

	group("throws if duplicate test titles", () => {

		test("cb api", async () => {

			const path = absPathFromRel(import.meta.url, "./fixture.throwDuplicate.js")

			const err = await check_ThrowsAsync(() => setup([path]))
			const msg = `Duplicate test name "a" ▶ "test" in same file: ` + relPathFromProjectRoot(path)
			check_is(err.message, msg)
		})

		test("mixed cb and obj apis", async () => {

			const path = absPathFromRel(import.meta.url, "./fixture.mixed.cb_obj.throwDuplicate.js")

			try {
				await setup([path])
			}
			catch (e) {
				const msg = `Duplicate test name "a" ▶ "test" in same file: ` + relPathFromProjectRoot(path)
				check_is(e.message, msg)
			}
		})
	})
})


async function setup(testFilePath_s) {
	return await run(testFilePath_s)
}

function relToProjectRoot(relPath) {
	let path = absPathFromRel(import.meta.url, relPath)
	path = relPathFromProjectRoot(path)
	return path
}
