import { group, test, check_is, check_Eq } from "../source/index.js"
import { deepDiff, empty } from "../source/deepDiff.js"


const deepDiffFN = "deepDiff() > "

test(deepDiffFN + "returns false for Equal structures", () => {

	let rec = deepDiff(null, null)
	check_is(rec, false)

	rec = deepDiff(undefined, undefined)
	check_is(rec, false)

	rec = deepDiff(NaN, NaN)
	check_is(rec, false)

	rec = deepDiff(0, 0)
	check_is(rec, false)

	rec = deepDiff("a", "a")
	check_is(rec, false)

	rec = deepDiff(false, false)
	check_is(rec, false)

	rec = deepDiff(9n, 9n)
	check_is(rec, false)

	const fn = () => {}
	rec = deepDiff(fn, fn)
	check_is(rec, false)

	rec = deepDiff(new Set([1]), new Set([1]))
	check_is(rec, false)

	rec = deepDiff([1, 2], [1, 2])
	check_is(rec, false)

	rec = deepDiff(new Map([["1", 1]]), new Map([["1", 1]]))
	check_is(rec, false)

	rec = deepDiff({k1: "a"}, {k1: "a"})
	check_is(rec, false)

	const date = new Date()
	rec = deepDiff(date, date)
	check_is(rec, false)

	rec = deepDiff(/a/, /a/)
	check_is(rec, false)
})

group(deepDiffFN + "returns correct diff for NON Equal structures", () => {

	test("different constructors", () => {
		let rec = deepDiff(/a/, [1])
		check_Eq(rec, [/a/, [1]])
	})


	test("Date", () => {

		const date1 = new Date("1970-01-02")
		const date2 = new Date("1970-01-03")

		let rec = deepDiff(date1, date2)
		check_Eq(rec, [date1, date2])
	})


	test("RegExp", () => {

		let rec = deepDiff(/a/, /b/)
		check_Eq(rec, [/a/, /b/])
	})


	test("Set", () => {

		const obj = { p1: "k1" }
		const obj2 = { p3: "k3" }
		const a = new Set([1, 4, { p1: "k2" }, false, "hi", obj, obj2])
		const b = new Set([1, 5, { p2: "k2" }, "hi", "hey", obj])

		const rec = deepDiff(a, b)

		const diff_a = new Set([4, { p1: "k2" }, false, obj2])
		const diff_b = new Set([5, { p2: "k2" }, "hey"])
		const exp = [diff_a, diff_b]

		check_Eq(rec, exp)
	})


	test("Map", () => {

		const fn = () => { }
		const sym = Symbol()

		let a = new Map([
			["a", "b"],
			[1, { k1: "a" }],
			[fn, 2],
			[sym, 3],
		])

		const fn2 = () => { }
		let b = new Map([
			["a", "b"],
			["c", 3],
			[1, { k1: "a", k2: "e" }],
			[{k3: "f" }, fn2],
			[fn, 4],
		])

		const rec = deepDiff(a, b)
		const exp = {
			type: "Map",
			diffs: new Map([
				["c", [empty, 3]],
				[sym, [3, empty]],
				[1, {
					type: "Object",
					diffs: new Map([
						["k2", [empty, "e"]],
					]),
				}],
				[fn, [2, 4]],
				[{ k3: "f" }, [empty, fn2]],
			]),
		}

		check_Eq(rec, exp)
	})


	test("Array", () => {

		let a = [0, [2], { k1: "a" }, 5]
		let b = [0, 4, { k1: "b" }]

		let rec = deepDiff(a, b)

		let exp = {
			type: "Array",
			diffs: new Map([
				[1, [[2], 4]],
				[2, {
					type: "Object",
					diffs: new Map([
						["k1", ["a", "b"]],
					]),
				}],
				[3, [5, empty]],
			]),
		}

		check_Eq(rec, exp)

		a = [0]
		b = [0, 2]

		rec = deepDiff(a, b)
		exp = {
			type: "Array",
			diffs: new Map([
				[1, [empty, 2]],
			]),
		}

		check_Eq(rec, exp)
	})


	test("(Deep) Object", () => {

		const fn_p1 = () => 1
		const fn_p2 = () => 2
		const p5 = Symbol("p5")
		const p6 = Symbol("p6")
		const p8 = Symbol("p8")
		const p9 = Symbol("p9")

		const a = {
			p1: fn_p1,
			p3: "p3",
			p4: 4,
			[p5]: p5,
			[p6]: 1,
			[p9]: 1,
			p7: {
				pp7: [1, 2],
				pp8: 65,
				set1: new Set([1, 2]),
			},
		}

		const b = {
			p2: fn_p2,
			p3: 3,
			p4: {
				pp4: "pp4",
			},
			[p6]: "a",
			[p8]: 0,
			[p9]: 1,
			p7: {
				pp7: [1],
				pp8: 65,
				set1: new Set([1, 3]),
			},
		}

		const rec = deepDiff(a, b)

		const exp = {
			type: "Object",
			diffs: new Map([
				["p1", [fn_p1, empty]],
				["p2", [empty, fn_p2]],
				["p3", ["p3", 3]],
				["p4", [4, { pp4: "pp4" }]],
				[p5, [p5, empty]],
				[p6, [1, "a"]],
				[p8, [empty, 0]],
				["p7", {
					type: "Object",
					diffs: new Map([
						["pp7", {
							type: "Array",
							diffs: new Map([
								[1, [2, empty]],
							]),
						}],
						["set1", [new Set([2]), new Set([3])]],
					]),
				}],
			]),
		}

		check_Eq(rec, exp)
	})


	test("Unsuported Constructors", () => {

		function ObjCtor() { }

		const a = new ObjCtor()
		const b = new ObjCtor()

		const rec = deepDiff(a, b)
		const exp = [a, b]

		check_Eq(rec, exp)
	})
})
