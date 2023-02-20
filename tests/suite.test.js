import { describe, it, expect } from "vitest"
import { objToSuite, group, test, buildTestID as ID } from "../source/suite.js"
import { SOPHI } from "../source/utils.js"
import { fn1, fn2, fn3, fn4, fn5, toSuiteSchema } from "./utils.js"


const collector = globalThis[SOPHI].collector

describe("callback api", () => {

	it("nesting", () => {

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

		const exp = toSuiteSchema({
			runnable: [
				[ID(["a", "aa"], "test 1"), {fn: fn1}],
				[ID(["a", "aa"], "test 2"), {fn: fn2}],
				[ID(["a"], "test 3"), {fn: fn3}],
				[ID(["b"], "test 4"), {fn: fn4}],
				[ID([], `test 5`), {fn: fn5}],
			],
		})

		expect(rec).toMatchObject(exp)
	})

	describe("modifiers", () => {

		it("todo(): works - even nested in skipped, just or only", () => {

			group.skip("a", () => {
				group.just("aa", () => {
					group.only("aaa", () => {
						test.todo("test 1")
					})
					test.todo("test 2")
				})
			})

			const rec = collector.pullSuite()

			const exp = toSuiteSchema({
				todos: [
					[ID(["a", "aa", "aaa"], "test 1"), {}],
					[ID(["a", "aa"], "test 2"), {}],
				],
				justUsed: true,
			})

			expect(rec).toMatchObject(exp)
		})

		it("just(): innest group.just() takes precedence", () => {

			group.just("a", () => {
				group.just("aa", () => {
					test("test 1", fn1)       // runs
					test("test 2", fn2)       // runs
				})
				test("test 3", fn3)    // skipped
			})

			const rec = collector.pullSuite()

			const exp = toSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 1"), {fn: fn1}],
					[ID(["a", "aa"], "test 2"), {fn: fn2}],
				],
				skipped: [
					[ID(["a"], "test 3"), {}],
				],
				justUsed: true,
			})

			expect(rec).toMatchObject(exp)
		})

		it("just(): latest test.just() takes precedence", () => {

			group.just("a", () => {
				group.just("aa", () => {
					test.just("test 1", fn1)       // skipped
					test.just("test 2", fn2)       // runs
				})
				test("test 3", fn3)    // skipped
			})

			const rec = collector.pullSuite()

			const exp = toSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 2"), {fn: fn2}],
				],
				skipped: [
					[ID(["a", "aa"], "test 1"), {}],
					[ID(["a"], "test 3"), {}],
				],
				justUsed: true,
			})

			expect(rec).toMatchObject(exp)
		})

		it("only(): innest group.only() takes precedence", () => {

			group.only("a", () => {
				group.only("aa", () => {   // innest only group wins
					test("test 1", fn1)       // runs
					test("test 2", fn2)       // runs
				})
				test("test 3", fn3)    // skipped
			})

			const rec = collector.pullSuite()

			const exp = toSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 1"), {fn: fn1}],
					[ID(["a", "aa"], "test 2"), {fn: fn2}],
				],
				skipped: [
					[ID(["a"], "test 3"), {}],
				],
			})

			expect(rec).toMatchObject(exp)
		})

		it("only(): latest test.only() takes precedence", () => {

			group.only("a", () => {
				group.only("aa", () => {
					test.only("test 1", fn1)       // skipped
					test.only("test 2", fn2)       // runs
				})
				test("test 3", fn3)    // skipped
			})

			const rec = collector.pullSuite()

			const exp = toSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 2"), {fn: fn2}],
				],
				skipped: [
					[ID(["a", "aa"], "test 1"), {}],
					[ID(["a"], "test 3"), {}],
				],
			})

			expect(rec).toMatchObject(exp)
		})

		it("mixed only() and just() works", () => {

			group.only("a", () => {
				group.just("aa", () => {
					test.just("test 1", fn1)       // skipped
					test.only("test 2", fn2)       // runs
				})
				test("test 3", fn3)    // skipped
			})

			const rec = collector.pullSuite()

			const exp = toSuiteSchema({
				runnable: [
					[ID(["a", "aa"], "test 2"), {fn: fn2}],
				],
				skipped: [
					[ID(["a", "aa"], "test 1"), {}],
					[ID(["a"], "test 3"), {}],
				],
				justUsed: true,
			})

			expect(rec).toMatchObject(exp)
		})

		it("skip(): works with nested groups", () => {

			group("a", () => {
				group.skip("aa", () => {
					test("test 1", fn1)       // skipped
					test.just("test 2", fn2)       // skipped
				})
				test("test 3", fn3)    // runs
				test.skip("test 4", fn3)    // runs
			})

			const rec = collector.pullSuite()
			const exp = toSuiteSchema({
				runnable: [
					[ID(["a"], "test 3"), {fn: fn3}],
				],
				skipped: [
					[ID(["a", "aa"], "test 1"), {}],
					[ID(["a", "aa"], "test 2"), {}],
					[ID(["a"], "test 4"), {}],
				],
			})

			expect(rec).toMatchObject(exp)
		})
	})

	it("returns default schema for empty tests", () => {

		const rec = collector.pullSuite()

		const exp = toSuiteSchema({
		})

		expect(rec).toMatchObject(exp)
	})
})


describe("object api", () => {

	it("works with nesting", () => {

		let tests = {
			a: {
				aa: {
					"test 1"() {

					},
					["test 2"]: fn2,
				},
				"test 3"() {
				},
			},
			b: {
				["test 4"]: fn4,
			},
		}

		tests.a.aa["test 1"] = fn1
		tests.a["test 3"] = fn3

		const rec = objToSuite(tests)

		const exp = toSuiteSchema({
			runnable: [
				[ID(["a", "aa"], "test 1"), {fn: fn1}],
				[ID(["a", "aa"], "test 2"), {fn: fn2}],
				[ID(["a"], "test 3"), {fn: fn3}],
				[ID(["b"], "test 4"), {fn: fn4}],
			],
		})

		expect(rec).toMatchObject(exp)
	})

	it("return default schema for empty tests", () => {

		let tests = {}

		const rec = objToSuite(tests)
		const exp = toSuiteSchema({})

		expect(rec).toMatchObject(exp)
	})
})
