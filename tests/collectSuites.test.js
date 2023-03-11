import { topic, test, check_Eq, check_ThrowsAsync } from "../source/index.js"
import { toRelPathFromProjRoot, fn1 } from "./utils.js"
import { collectSuites } from "../source/collectSuites.js"
import { Suite } from "../source/run.js"

const _toRelPathFromProjRoot = toRelPathFromProjRoot(import.meta.url)

topic("run()", () => {

	test("only() works across files: it should select only the files that use it", async () => {

		let filePath_s = ["./fixture.only.js", "./fixture.pass.js"]
			.map(_toRelPathFromProjRoot)

		const suite = await setup(filePath_s)

		const expectedSuite = toFileSuiteSchema({
			runnable: [
				[ID(["b"], "test b"), fn1],
			],
			n_Tests: 1,
			onlyUsed: true,
		})

		const expSuites = new Map([
			[_toRelPathFromProjRoot("./fixture.only.js"), expectedSuite],
		])

		check_Eq(suite.onlyUsed, true)
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

	test.todo("mixed impure and pure api in same file: pure api overwrites impute built suite", async () => {

		// const filePath = _toRelPathFromProjRoot("./fixture.mixed.cb_obj.js")
		// const rec = await setup([filePath])
	})
})


async function setup(filePath_s) {
	const suite = Suite()
	await collectSuites(suite, filePath_s)
	return suite
}

export function toFileSuiteSchema({runnable, skip, todo, n_Tests, onlyUsed}) {

	let fileSuite = {
		clusters: {
			runnable: runnable ? new Map(runnable) : new Map(),
			skip: skip ? new Set(skip) : new Set(),
			todo: todo ? new Set(todo) : new Set(),
		},
		n_Tests,
	}

	if (onlyUsed) fileSuite.onlyUsed = true

	return fileSuite
}
