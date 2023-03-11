import {
	describe, it,
	group, test,
	check_Eq as _check_Eq_,
 } from "../source/index.js"
import { objToSuite } from "../source/FileSuite.js"
import { GLOB_SOPHI_K } from "../source/utils.js"
import { fn1, fn2, fn3, fn4, fn5 } from "./utils.js"


const {collector} = globalThis[GLOB_SOPHI_K]

it("returns default schema for empty tests", () => {

	const rec = collector.pullSuite()

	const exp = toFileSuiteSchema({
		n_Tests: 0,
	})

	_check_Eq_(rec, exp)
})

it("simple nesting", () => {

	group("a", () => {
		group("aa", () => {
			test("test 1", fn1)
			test("test 2", fn2)
		})
		test("test 3", fn3)
	})
	group("b", () => {
		test("test 4", fn4)
	})
	test("test 5", fn5)

	const rec = collector.pullSuite()

	const exp = toFileSuiteSchema({
		runnable: [
			[ID(["a", "aa"], "test 1"), fn1],
			[ID(["a", "aa"], "test 2"), fn2],
			[ID(["a"], "test 3"), fn3],
			[ID(["b"], "test 4"), fn4],
			[ID([], `test 5`), fn5],
		],
		n_Tests: 5,
	})

	_check_Eq_(rec, exp)
})

describe("modifiers", () => {

	describe("only(): exclusively a single only() (test or group) is ran. The latest declared takes precedence", () => {

		it("with tests being the last", () => {

			group("a", () => {
				test.skip("test 1", () => { })    // ignored
				test.todo("test 3")               // ignored
				test.only("test 4", () => { })    // ignored
				test.only("test 5", fn5)          // runs
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a"], "test 5"), fn5],
				],
				n_Tests: 1,
				onlyUsed: true,
			})

			_check_Eq_(rec, exp)
		})

		it("with tests not being the last", () => {

			group("a", () => {
				test.skip("test 1", () => {})    // ignored
				test.only("test 4", fn4)         // runs
				test.todo("test 3")              // ignored
				test("test 5", () => {})         // ignored
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a"], "test 4"), fn4],
				],
				n_Tests: 1,
				onlyUsed: true,
			})

			_check_Eq_(rec, exp)
		})

		it("with tests inside groups", () => {

			group("a", () => {
				group.only("aa", () => {
					test.only("test 2", () => { })   // ignored
					test("test 3", () => { })        // ignored
				})

				group.only("aa", () => {
					test.only("test 4", () => { })   // ignored
					test("test 5", () => { })        // ignored
				})
				test.only("test 1", fn1)            // runs
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a"], "test 1"), fn1],
				],
				n_Tests: 1,
				onlyUsed: true,
			})

			_check_Eq_(rec, exp)

		})

		it("only() group after the other only() group", () => {

			group("a", () => {
				group.only("aa", () => {
					test.only("test 2", () => {})   // ignored
					test("test 3", () => {})        // ignored
				})
				group.only("aa", () => {
					test("test 4", fn4)       // runs
					test("test 5", fn5)       // runs
				})
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 4"), fn4],
					[ID(["a", "aa"], "test 5"), fn5],
				],
				n_Tests: 2,
				onlyUsed: true,
			})

			_check_Eq_(rec, exp)
		})

		it("over the rest of modifiers", () => {

			group("a", () => {
				group.skip("aa", () => {
					test("test 1", () => { })     // ignored
					test.only("test 2", fn2)      // runs
					test.todo("test 4")          // ignored
				})
				test.skip("test 6", () => { })   // ignored
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 2"), fn2],
				],
				n_Tests: 1,
				onlyUsed: true,
			})

			_check_Eq_(rec, exp)
		})
	})

	describe("skip()", () => {

		it("with tests", () => {

			group("a", () => {
				test.skip("test 1", () => {})   // skipped
				test("test 2", fn2)             // runs
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a"], "test 2"), fn2],
				],
				skip: [
					ID(["a"], "test 1"),
				],
				n_Tests: 2,
			})

			_check_Eq_(rec, exp)
		})

		it("with tests inside groups", () => {

			group("a", () => {
				group.skip("aa", () => {
					test("test 1", () => { })         // skip
					test("test 2", () => { })         // skip
				})
				group("aa", () => {
					test("test 3", fn3)              // runs
				})
				test.skip("test 4", () => { })       // skip
			})

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 3"), fn3],
				],
				skip: [
					ID(["a", "aa"], "test 1"),
					ID(["a", "aa"], "test 2"),
					ID(["a"], "test 4"),
				],
				n_Tests: 4,
			})

			_check_Eq_(rec, exp)
		})
	})

	describe("todo", () => {

		it("is added when inside NOT modified groups", () => {

			group("a", () => {
				test.todo("test 1")
			})
			test.todo("test 2")

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				todo: [
					ID(["a"], "test 1"),
					ID([], "test 2"),
				],
				n_Tests: 2,
			})

			_check_Eq_(rec, exp)
		})

		it("not added when inside skip", () => {

			group.skip("a", () => {
				test.todo("test 1")
			})
			test.todo("test 2")

			const rec = collector.pullSuite()

			const exp = toFileSuiteSchema({
				todo: [
					ID([], "test 2"),
				],
				n_Tests: 1,
			})

			_check_Eq_(rec, exp)
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

		const exp = toFileSuiteSchema({
			runnable: [
				[ID(["a", "aa"], "test 1"), fn1],
				[ID(["a", "aa"], "test 2"), fn2],
				[ID(["a"], "test 3"), fn3],
				[ID(["b"], "test 4"), fn4],
			],
			n_Tests: 4,
		})

		_check_Eq_(rec, exp)
	})

	it("return default schema for empty tests", () => {

		let tests = {}

		const rec = objToSuite(tests)
		const exp = toFileSuiteSchema({
			n_Tests: 0,
		})

		_check_Eq_(rec, exp)
	})
})


function toFileSuiteSchema({runnable, skip, todo, n_Tests, onlyUsed}) {

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
