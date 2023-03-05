import { topic, test, check_is, check_Eq, check_ThrowsAsync } from "../source/index.js"
import { toRelPathFromProjRoot, fn1 } from "./utils.js"
import { collectSuites } from "../source/collectSuites.js"
import { Suite } from "../source/run.js"
import { buildTestID as ID } from "../source/suite.js"

const _toRelPathFromProjRoot = toRelPathFromProjRoot(import.meta.url)

topic("run()", () => {

	test("one() works across files: it should select only the files that use it", async () => {

		let filePath_s = ["./fixture.one.js", "./fixture.noOneOrJust.js"]
			.map(_toRelPathFromProjRoot)

		const suite = await setup(filePath_s)

		const expectedSuite = toFileSuiteSchema({
			runnable: [
				[ID(["b"], "test b"), fn1],
			],
			n_Tests: 1,
		})

		const expSuites = new Map([
			[_toRelPathFromProjRoot("./fixture.one.js"), expectedSuite],
		])

		check_is(suite.oneOrJustUsed, "one")
		check_Eq(suite.suites, expSuites)
	})

	test("just() works across files: only the files that used just are selected", async () => {

		let filePath_s = ["./fixture.just1.js", "./fixture.noOneOrJust.js", "./fixture.just2.js"]
			.map(_toRelPathFromProjRoot)

		const suite = await setup(filePath_s)

		const fileSuite_just1 = toFileSuiteSchema({
			runnable: [
				[ID(["b"], "test b"), fn1],
			],
			n_Tests: 1,
		})

		const fileSuite_just2 = toFileSuiteSchema({
			runnable: [
				[ID(["g"], "test g"), fn1],
			],
			n_Tests: 1,
		})

		const paths = ["./fixture.just1.js", "./fixture.just2.js"]
			.map(_toRelPathFromProjRoot)

		const expSuites = new Map([
			[paths[0], fileSuite_just1],
			[paths[1], fileSuite_just2],
		])

		check_is(suite.oneOrJustUsed, "just")
		check_Eq(suite.suites, expSuites)
	})

	test("works with obj api", async () => {

		const filePath = _toRelPathFromProjRoot("./fixture.cb_obj.js")
		const rec = await setup([filePath])

		const expectedSuite = toFileSuiteSchema({
			runnable: [
				[ID(["a"], "test 2"), fn1],
				[ID([], "test 3"), fn1],
			],
			n_Tests: 2,
		})

		const exp = new Map([
			[filePath, expectedSuite],
		])

		check_Eq(rec.suites, exp)
	})

	topic("mixed cb/object api in same file", () => {

		test("are merged correctly in suite", async () => {

			const filePath = _toRelPathFromProjRoot("./fixture.mixed.cb_obj.js")
			const rec = await setup([filePath])

			const expectedSuite = toFileSuiteSchema({
				runnable: [
					[ID(["a"], "test 1"), fn1],
					[ID(["a"], "test 2"), fn1],
					[ID([], "test 3"), fn1],
				],
				n_Tests: 3,
			})

			const exp = new Map([
				[filePath, expectedSuite],
			])

			check_Eq(rec.suites, exp)
		})
	})

	topic("throws if duplicate test titles", () => {

		test("cb api", async () => {

			const filePath = _toRelPathFromProjRoot("./fixture.throwDuplicate.js")

			const err = await check_ThrowsAsync(() => setup([filePath]))
			const msg = `Duplicate test name "a" ▶ "test" in same file: ` + filePath
			check_is(err.message, msg)
		})

		test("mixed cb and obj apis", async () => {

			const filePath = _toRelPathFromProjRoot("./fixture.mixed.cb_obj.throwDuplicate.js")

			try {
				await setup([filePath])
			}
			catch (e) {
				const msg = `Duplicate test name "a" ▶ "test" in same file: ` + filePath
				check_is(e.message, msg)
			}
		})
	})
})


async function setup(filePath_s) {
	const suite = Suite()
	await collectSuites(suite, filePath_s)
	return suite
}

export function toFileSuiteSchema({runnable, skip, todo, n_Tests}) {

	let fileSuite = {
		clusters: {
			runnable: runnable ? new Map(runnable) : new Map(),
			skip: skip ? new Set(skip) : new Set(),
			todo: todo ? new Set(todo) : new Set(),
		},
		n_Tests,
	}

	return fileSuite
}
